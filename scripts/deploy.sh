#!/bin/bash
# ===========================================
# SCRIPT DE DEPLOY - DATA PIPELINE COMPLIANCE
# ===========================================
#
# Script para deploy do pipeline de compliance em diferentes ambientes.
#
# Uso:
#   ./scripts/deploy.sh [ambiente]
#
# Ambientes disponíveis:
#   - dev: Ambiente de desenvolvimento
#   - staging: Ambiente de staging
#   - production: Ambiente de produção
#
# Exemplos:
#   ./scripts/deploy.sh dev
#   ./scripts/deploy.sh staging
#   ./scripts/deploy.sh production
#
# Autor: Data Engineering Team
# Data: 2026-03-29
#

set -e

# ===========================================
# CONFIGURAÇÕES
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ===========================================
# FUNÇÕES AUXILIARES
# ===========================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Verificando dependências..."

    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado. Por favor, instale o Docker."
        exit 1
    fi

    # Verificar Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose não encontrado. Por favor, instale o Docker Compose."
        exit 1
    fi

    # Verificar Git
    if ! command -v git &> /dev/null; then
        log_error "Git não encontrado. Por favor, instale o Git."
        exit 1
    fi

    log_success "Todas as dependências estão instaladas."
}

validate_environment() {
    local env=$1

    case $env in
        dev|staging|production)
            log_info "Ambiente válido: $env"
            ;;
        *)
            log_error "Ambiente inválido: $env"
            log_error "Ambientes disponíveis: dev, staging, production"
            exit 1
            ;;
    esac
}

load_environment() {
    local env=$1
    local env_file="$PROJECT_DIR/.env.$env"

    if [ -f "$env_file" ]; then
        log_info "Carregando configurações do ambiente: $env"
        source "$env_file"
    else
        log_warning "Arquivo de ambiente não encontrado: $env_file"
        log_warning "Usando configurações padrão."
    fi
}

backup_current_version() {
    log_info "Criando backup da versão atual..."

    local backup_dir="$PROJECT_DIR/backups/$TIMESTAMP"
    mkdir -p "$backup_dir"

    # Backup de configurações
    if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        cp "$PROJECT_DIR/docker-compose.yml" "$backup_dir/"
    fi

    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$backup_dir/"
    fi

    # Backup de dados (se existirem)
    if [ -d "$PROJECT_DIR/data" ]; then
        tar -czf "$backup_dir/data_backup.tar.gz" -C "$PROJECT_DIR" data/
    fi

    log_success "Backup criado em: $backup_dir"
}

stop_services() {
    log_info "Parando serviços..."

    cd "$PROJECT_DIR"

    if [ -f "docker-compose.yml" ]; then
        docker compose down
        log_success "Serviços parados."
    else
        log_warning "docker-compose.yml não encontrado."
    fi
}

build_images() {
    log_info "Construindo imagens Docker..."

    cd "$PROJECT_DIR"

    # Build imagem de ingestão
    if [ -d "ingestion" ]; then
        log_info "Construindo imagem de ingestão..."
        docker build -t compliance-ingestion:latest ./ingestion/
        log_success "Imagem de ingestão construída."
    fi

    # Build imagem de transformação
    if [ -d "transformation" ]; then
        log_info "Construindo imagem de transformação..."
        docker build -t compliance-transformation:latest ./transformation/
        log_success "Imagem de transformação construída."
    fi
}

start_services() {
    log_info "Iniciando serviços..."

    cd "$PROJECT_DIR"

    if [ -f "docker-compose.yml" ]; then
        docker compose up -d
        log_success "Serviços iniciados."
    else
        log_error "docker-compose.yml não encontrado."
        exit 1
    fi
}

wait_for_services() {
    log_info "Aguardando serviços ficarem prontos..."

    # Aguardar PostgreSQL
    log_info "Aguardando PostgreSQL..."
    until docker exec compliance-postgres pg_isready -U airflow; do
        sleep 2
    done
    log_success "PostgreSQL está pronto."

    # Aguardar Redis
    log_info "Aguardando Redis..."
    until docker exec compliance-redis redis-cli ping | grep -q PONG; do
        sleep 2
    done
    log_success "Redis está pronto."

    # Aguardar Airflow Webserver
    log_info "Aguardando Airflow Webserver..."
    until curl -s http://localhost:8080/health | grep -q "healthy"; do
        sleep 5
    done
    log_success "Airflow Webserver está pronto."
}

run_migrations() {
    log_info "Executando migrações..."

    # Executar migrações do Airflow
    docker exec compliance-airflow-init airflow db init

    # Criar usuário admin se não existir
    docker exec compliance-airflow-init airflow users create \
        --username admin \
        --password admin \
        --firstname Admin \
        --lastname User \
        --role Admin \
        --email admin@example.com || true

    log_success "Migrações executadas."
}

run_tests() {
    log_info "Executando testes de smoke..."

    # Verificar se os serviços estão respondendo
    if curl -s http://localhost:8080/health > /dev/null; then
        log_success "Airflow está respondendo."
    else
        log_error "Airflow não está respondendo."
        return 1
    fi

    if curl -s http://localhost:8081 > /dev/null; then
        log_success "Spark Master está respondendo."
    else
        log_error "Spark Master não está respondendo."
        return 1
    fi

    log_success "Testes de smoke passaram."
}

show_status() {
    log_info "Status dos serviços:"
    docker compose ps

    echo ""
    log_info "URLs de acesso:"
    echo "  - Airflow UI: http://localhost:8080"
    echo "  - Spark Master UI: http://localhost:8081"
    echo "  - Jupyter Notebook: http://localhost:8888"
    echo "  - Grafana: http://localhost:3000"
    echo "  - Prometheus: http://localhost:9090"
}

# ===========================================
# FUNÇÃO PRINCIPAL
# ===========================================

main() {
    local environment=${1:-dev}

    log_info "Iniciando deploy do Data Pipeline Compliance"
    log_info "Ambiente: $environment"
    log_info "Timestamp: $TIMESTAMP"

    # Validar ambiente
    validate_environment "$environment"

    # Verificar dependências
    check_dependencies

    # Carregar configurações do ambiente
    load_environment "$environment"

    # Criar backup
    backup_current_version

    # Parar serviços
    stop_services

    # Construir imagens
    build_images

    # Iniciar serviços
    start_services

    # Aguardar serviços
    wait_for_services

    # Executar migrações
    run_migrations

    # Executar testes
    run_tests

    # Mostrar status
    show_status

    log_success "Deploy concluído com sucesso!"
    log_info "Logs disponíveis em: $PROJECT_DIR/logs/"
}

# ===========================================
# EXECUÇÃO
# ===========================================

# Verificar se foi passado argumento
if [ $# -eq 0 ]; then
    log_warning "Nenhum ambiente especificado. Usando 'dev' como padrão."
    main "dev"
else
    main "$1"
fi
