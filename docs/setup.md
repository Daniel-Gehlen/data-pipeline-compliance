# Guia de Setup - Data Pipeline Compliance

Este documento descreve os passos para configurar e executar o pipeline de dados de compliance.

## 📋 Pré-requisitos

### Software Necessário
- **Apache Spark** 3.4+
- **Scala** 2.12+
- **SBT** 1.9+ (para build do Scala)
- **Python** 3.9+
- **DBT** 1.6+
- **Apache Airflow** 2.7+
- **Great Expectations** 0.17+
- **Delta Lake** 2.4+
- **Docker** 24+ (opcional, para ambiente containerizado)
- **Docker Compose** 2.20+ (opcional)

### Dependências de Banco de Dados
- **PostgreSQL** 15+ (para metadados Airflow e dados fonte)
- **Apache Hive Metastore** (para catálogo Spark)

## 🚀 Instalação Rápida

### 1. Clonar Repositório
```bash
git clone <repository-url>
cd data-pipeline-compliance
```

### 2. Configurar Ambiente Python
```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente
Criar arquivo `.env` na raiz do projeto:
```bash
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compliance_db
DB_USER=compliance_user
DB_PASSWORD=your_password_here

# Spark
SPARK_HOME=/opt/spark
SPARK_MASTER=local[*]

# Airflow
AIRFLOW_HOME=/opt/airflow
AIRFLOW__CORE__SQL_ALCHEMY_CONN=postgresql+psycopg2://airflow:airflow@localhost:5432/airflow

# Great Expectations
GE_HOME=/opt/airflow/validation

# Kafka (opcional)
KAFKA_BROKERS=localhost:9092

# Delta Lake
DELTA_TABLE_PATH=/data/delta
```

### 4. Configurar Spark
```bash
# Instalar Spark (exemplo para Linux)
wget https://downloads.apache.org/spark/spark-3.4.1/spark-3.4.1-bin-hadoop3.tgz
tar -xzf spark-3.4.1-bin-hadoop3.tgz
sudo mv spark-3.4.1-bin-hadoop3 /opt/spark

# Configurar variáveis de ambiente
export SPARK_HOME=/opt/spark
export PATH=$SPARK_HOME/bin:$PATH

# Instalar Delta Lake
pip install delta-spark
```

### 5. Configurar DBT
```bash
cd transformation

# Instalar DBT
pip install dbt-core dbt-postgres dbt-spark

# Configurar perfil
cat > ~/.dbt/profiles.yml << EOF
data_pipeline_compliance:
  target: dev
  outputs:
    dev:
      type: postgres
      host: localhost
      port: 5432
      user: compliance_user
      password: your_password_here
      dbname: compliance_db
      schema: public
      threads: 4
      keepalives_idle: 0
EOF

# Instalar dependências DBT
dbt deps

# Testar conexão
dbt debug
```

### 6. Configurar Airflow
```bash
cd orchestration

# Inicializar banco de dados Airflow
airflow db init

# Criar usuário admin
airflow users create \
    --username admin \
    --password admin \
    --firstname Admin \
    --lastname User \
    --role Admin \
    --email admin@example.com

# Iniciar serviços Airflow
airflow webserver --port 8080 &
airflow scheduler &
```

### 7. Configurar Great Expectations
```bash
cd validation

# Inicializar Great Expectations
great_expectations init

# Criar datasource
great_expectations datasource new

# Criar expectation suite
great_expectations suite new

# Criar checkpoint
great_expectations checkpoint new compliance_checkpoint
```

## 🐳 Setup com Docker (Recomendado)

### 1. Build e Start dos Containers
```bash
# Build das imagens
docker-compose build

# Iniciar serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

### 2. Acessar Interfaces
- **Airflow UI**: http://localhost:8080
- **Spark Master UI**: http://localhost:8081
- **Great Expectations UI**: http://localhost:8082

## 📊 Configuração de Fontes de Dados

### PostgreSQL (Fonte JDBC)
```sql
-- Criar banco de dados
CREATE DATABASE compliance_db;

-- Criar tabela de transações
CREATE TABLE compliance_transactions (
    id VARCHAR(100) PRIMARY KEY,
    transaction_date TIMESTAMP NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(18, 2),
    currency VARCHAR(10),
    status VARCHAR(50) NOT NULL,
    risk_score INTEGER,
    compliance_flags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    source_system VARCHAR(100) NOT NULL,
    batch_id VARCHAR(100) NOT NULL
);

-- Criar índices
CREATE INDEX idx_transaction_date ON compliance_transactions(transaction_date);
CREATE INDEX idx_entity_id ON compliance_transactions(entity_id);
CREATE INDEX idx_status ON compliance_transactions(status);
CREATE INDEX idx_risk_score ON compliance_transactions(risk_score);
```

### Kafka (Fonte Streaming)
```bash
# Criar tópico
kafka-topics.sh --create \
    --topic compliance-transactions \
    --bootstrap-server localhost:9092 \
    --partitions 10 \
    --replication-factor 1
```

## 🔄 Execução do Pipeline

### Execução Manual
```bash
# 1. Executar ingestão Spark
spark-submit \
    --class com.company.data.pipeline.ingestion.IngestComplianceData \
    --master local[*] \
    --packages io.delta:delta-core_2.12:2.4.0 \
    ingestion/ingest_compliance_data.scala \
    --date 2026-03-29 \
    --source jdbc \
    --output /data/raw/compliance

# 2. Executar transformações DBT
cd transformation
dbt run --vars '{"processing_date": "2026-03-29"}'
dbt test

# 3. Executar validações Great Expectations
cd validation
great_expectations checkpoint run compliance_checkpoint
```

### Execução via Airflow
```bash
# Listar DAGs
airflow dags list

# Ativar DAG
airflow unpause pipeline_compliance

# Executar DAG manualmente
airflow dags trigger pipeline_compliance \
    --exec-date 2026-03-29

# Monitorar execução
airflow dags list-runs -d pipeline_compliance
```

## 🧪 Testes

### Testes Unitários
```bash
# Testes Scala
cd ingestion
sbt test

# Testes Python
cd tests
pytest

# Testes DBT
cd transformation
dbt test
```

### Testes de Integração
```bash
# Executar suite completa de testes
./scripts/run_tests.sh
```

## 📈 Monitoramento

### Logs
```bash
# Logs Airflow
tail -f $AIRFLOW_HOME/logs/dag_id=pipeline_compliance/**/*.log

# Logs Spark
tail -f $SPARK_HOME/logs/spark-*.out

# Logs Great Expectations
tail -f validation/uncommitted/logs/*.log
```

### Métricas
- **Data Docs**: http://localhost:8082/data_docs
- **Airflow Metrics**: http://localhost:8080/admin/metrics/
- **Spark Metrics**: http://localhost:8081/metrics/

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão Spark
```
Solution: Verificar se Spark Master está rodando
docker-compose logs spark-master
```

#### 2. Erro de Schema DBT
```
Solution: Executar dbt debug para verificar conexão
dbt debug
```

#### 3. Erro de Validação Great Expectations
```
Solution: Verificar se checkpoint está configurado
great_expectations checkpoint list
```

#### 4. Erro de Permissão Delta Lake
```
Solution: Verificar permissões do diretório
chmod -R 755 /data/delta
```

## 📚 Referências

- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [DBT Documentation](https://docs.getdbt.com/)
- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [Delta Lake Documentation](https://docs.delta.io/)

## 🆘 Suporte

Para suporte técnico, criar Issue no repositório ou contactar:
- **Data Engineering Team**: data-engineering@company.com
- **Slack**: #data-pipeline-support
