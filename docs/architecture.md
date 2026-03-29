# Arquitetura do Data Pipeline Compliance

Este documento descreve a arquitetura completa do pipeline de dados de compliance, incluindo os componentes, fluxo de dados e decisões de design.

## 📐 Visão Geral da Arquitetura

O pipeline de compliance é construído com uma arquitetura em camadas (layered architecture) que promove:
- **Separação de responsabilidades**: Cada camada tem um propósito específico
- **Rastreabilidade**: Metadados e auditoria em cada etapa
- **Escalabilidade**: Componentes independentes e horizontalmente escaláveis
- **Confiabilidade**: Tratamento de falhas e retry automático
- **Governança**: Controle de qualidade e conformidade em cada camada

## 🏗️ Componentes Principais

### 1. Camada de Ingestão (Apache Spark/Scala)
**Responsabilidade**: Leitura de dados brutos de fontes diversas

**Componentes**:
- `IngestComplianceData`: Job principal em Scala
- Suporte a múltiplas fontes: JDBC, JSON, Kafka
- Validação de schema na entrada
- Enriquecimento de dados com metadados
- Escrita no Delta Lake com versionamento

**Tecnologias**:
- Apache Spark 3.4+
- Scala 2.12
- Delta Lake 2.4+

**Padrões Utilizados**:
- Schema-on-read com validação
- Idempotência via merge/update
- Particionamento por data e tipo de entidade
- Compactação automática (OPTIMIZE)

### 2. Camada de Transformação (DBT)
**Responsabilidade**: Modelagem e transformação declarativa de dados

**Componentes**:
- **Staging**: Limpeza e padronização inicial
  - `stg_compliance_transactions`
- **Intermediate**: Agregações e joins
  - `int_compliance_risk_analysis`
- **Mart**: Tabelas finais para consumo
  - `fct_compliance_transactions`
  - `dim_compliance_entities`

**Tecnologias**:
- DBT Core 1.6+
- SQL
- Jinja2

**Padrões Utilizados**:
- Modelagem em camadas (staging → intermediate → mart)
- Testes automáticos de qualidade
- Documentação inline
- Versionamento de modelos

### 3. Camada de Orquestração (Apache Airflow)
**Responsabilidade**: Agendamento, execução e monitoramento de pipelines

**Componentes**:
- `pipeline_compliance_dag`: DAG principal
- Task Groups organizados por funcionalidade
- Tratamento de falhas e retry
- Alertas e notificações

**Tecnologias**:
- Apache Airflow 2.7+
- Python 3.9+

**Padrões Utilizados**:
- DAGs idempotentes
- Task Groups para organização
- XCom para comunicação entre tasks
- Pools para controle de concorrência

### 4. Camada de Armazenamento (Delta Lake)
**Responsabilidade**: Persistência transacional com versionamento

**Componentes**:
- Tabelas Delta para dados brutos
- Tabelas Delta para dados transformados
- Tabela de auditoria de execuções
- Metadados de versionamento

**Tecnologias**:
- Delta Lake 2.4+
- Apache Spark

**Padrões Utilizados**:
- Transações ACID
- Time travel para auditoria
- Schema evolution
- Particionamento otimizado

### 5. Camada de Controle e Qualidade (Great Expectations)
**Responsabilidade**: Validação de dados e conformidade

**Componentes**:
- Expectation Suites por camada
- Checkpoints de validação
- Data Docs para documentação
- Integração com pipeline

**Tecnologias**:
- Great Expectations 0.17+
- Python

**Padrões Utilizados**:
- Expectations declarativas
- Validação por camada
- Relatórios automáticos
- Alertas para violações

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        FONTES DE DADOS                          │
└─────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   JDBC/DB    │    │    JSON      │    │    Kafka     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CAMADA DE INGESTÃO (Spark/Scala)                   │
│  • Leitura de fontes                                            │
│  • Validação de schema                                          │
│  • Enriquecimento de dados                                      │
│  • Escrita no Delta Lake                                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DELTA LAKE - CAMADA RAW                         │
│  • Dados brutos versionados                                     │
│  • Particionamento por data                                     │
│  • Transações ACID                                              │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CAMADA DE TRANSFORMAÇÃO (DBT)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  STAGING    │→│ INTERMEDIATE │→│    MART     │             │
│  │  • Limpeza  │  │  • Agregação│  │  • Tabelas  │             │
│  │  • Padroniz.│  │  • Joins    │  │  • Finais   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           CAMADA DE VALIDAÇÃO (Great Expectations)              │
│  • Validação de qualidade                                       │
│  • Testes de conformidade                                       │
│  • Geração de relatórios                                        │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 DELTA LAKE - CAMADA MART                        │
│  • Dados finais para consumo                                    │
│  • Otimizados para queries                                      │
│  • Governados e auditados                                       │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMIDORES FINAIS                         │
│  • Dashboards de BI                                             │
│  • Relatórios de Compliance                                     │
│  • APIs de Consulta                                             │
│  • Alertas de Risco                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Rastreabilidade e Auditoria

### Metadados de Execução
Cada execução do pipeline registra:
- ID de execução único
- Timestamp de início e fim
- Status de cada etapa
- Contagem de registros processados
- Versão do código
- Parâmetros de execução

### Versionamento de Dados
- Delta Lake mantém histórico de todas as alterações
- Time travel para consultas históricas
- Auditoria de mudanças por usuário
- Rollback automático em caso de falha

### Logs Estruturados
- Logs em formato JSON para fácil parsing
- Níveis de log configuráveis
- Rotação automática de logs
- Integração com sistemas de monitoramento

## 🛡️ Governança e Compliance

### Controles de Qualidade
1. **Validação de Schema**: Verificação de tipos e campos obrigatórios
2. **Testes de Integridade**: Chaves primárias e estrangeiras
3. **Validação de Negócio**: Reglas de compliance específicas
4. **Testes de Volume**: Verificação de contagem mínima/máxima

### Conformidade
- **LGPD**: Anonimização de dados sensíveis
- **SOX**: Trilha de auditoria completa
- **PCI-DSS**: Criptografia de dados financeiros
- **ISO 27001**: Controles de segurança

## ⚡ Performance e Otimização

### Estratégias de Otimização
1. **Particionamento**: Por data e tipo de entidade
2. **Compactação**: OPTIMIZE automático do Delta Lake
3. **Z-Ordering**: Ordenação por colunas frequentemente filtradas
4. **Cache**: Tabelas frequentemente acessadas em memória
5. **Paralelismo**: Configuração otimizada do Spark

### Métricas de Performance
- Tempo de execução por etapa
- Throughput de dados (registros/segundo)
- Uso de recursos (CPU, memória, disco)
- Latência de queries

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente
```bash
# Spark
SPARK_HOME=/opt/spark
SPARK_MASTER=local[*]
SPARK_EXECUTOR_MEMORY=4g
SPARK_DRIVER_MEMORY=2g

# DBT
DBT_PROFILES_DIR=~/.dbt
DBT_TARGET=dev

# Airflow
AIRFLOW_HOME=/opt/airflow
AIRFLOW__CORE__PARALLELISM=32

# Delta Lake
DELTA_TABLE_PATH=/data/delta
DELTA_RETENTION_DURATION=720h

# Great Expectations
GE_HOME=/opt/airflow/validation
```

## 📊 Monitoramento e Alertas

### Dashboards
- **Airflow UI**: Monitoramento de DAGs e tasks
- **Spark UI**: Métricas de execução de jobs
- **Great Expectations Data Docs**: Relatórios de qualidade

### Alertas
- Falhas de execução de pipeline
- Violações de SLA
- Problemas de qualidade de dados
- Erros de validação

## 🔄 Ciclo de Vida dos Dados

### Ingestão
- Frequência: Diária (batch) ou em tempo real (streaming)
- Retenção: 7 anos para compliance
- Formato: Delta Lake (Parquet + metadados)

### Transformação
- Camadas: staging → intermediate → mart
- Versionamento: Controle via DBT
- Testes: Automáticos em cada execução

### Armazenamento
- Camada Raw: Dados brutos originais
- Camada Processed: Dados transformados
- Camada Mart: Dados finais para consumo

### Arquivamento
- Dados antigos: Compressão e movimento para storage de baixo custo
- Retenção: Conforme política de compliance
- Destrução: Segura e auditada

## 📝 Próximos Passos

1. **Implementar monitoramento avançado** com Prometheus/Grafana
2. **Adicionar suporte a streaming** com Kafka Structured Streaming
3. **Implementar Machine Learning** para detecção de anomalias
4. **Criar API REST** para consulta de dados
5. **Implementar replicação** para alta disponibilidade
