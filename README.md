# Data Pipeline Compliance

Pipeline de dados modular e rastreável para compliance, seguindo boas práticas de engenharia de software.

## 🏗️ Arquitetura

O projeto é composto por 5 camadas principais:

1. **Ingestão** (Apache Spark/Scala) - Leitura de dados brutos
2. **Transformação** (DBT) - Modelagem e transformação declarativa
3. **Orquestração** (Apache Airflow) - Agendamento e monitoramento
4. **Armazenamento** (Delta Lake) - Transações ACID e versionamento
5. **Controle e Qualidade** (Great Expectations) - Validação e conformidade

## 📁 Estrutura do Projeto

```
/data-pipeline-compliance
├── /ingestion              # Jobs Spark em Scala
├── /transformation         # Models DBT
│   ├── /models
│   │   ├── /staging
│   │   ├── /intermediate
│   │   └── /mart
│   └── dbt_project.yml
├── /orchestration          # DAGs Airflow
├── /validation             # Great Expectations
├── /storage                # Configurações Delta Lake
├── /tests                  # Testes automatizados
├── /docs                   # Documentação
├── .gitignore
└── README.md
```

## 🚀 Como Usar

### Pré-requisitos
- Apache Spark 3.x
- DBT
- Apache Airflow
- Delta Lake
- Great Expectations
- Scala 2.12+

### Instalação
```bash
# Clonar repositório
git clone <repository-url>
cd data-pipeline-compliance

# Configurar ambiente Spark
# (instruções detalhadas em docs/setup.md)

# Instalar dependências DBT
cd transformation
dbt deps

# Inicializar Airflow
cd orchestration
airflow db init
```

## 📊 Monitoramento

- Dashboards de saúde dos pipelines
- Alertas para falhas e violações de SLA
- Auditoria completa de execuções

## 🔍 Rastreabilidade

- Versionamento de código e dados (Delta Lake)
- Metadados de execução em tabelas de auditoria
- Linhagem de dados documentada no DBT

## 📝 Documentação

- [Guia de Setup](docs/setup.md)
- [Arquitetura](docs/architecture.md)
- [Boas Práticas](docs/best-practices.md)
- [DBT Docs](transformation/target/index.html)

## 🤝 Contribuição

1. Criar Issue descrevendo a melhoria
2. Criar Branch: `git checkout -b feature/nome-da-melhoria`
3. Desenvolver e commitar: `git commit -m "feat: descrição"`
4. Enviar Pull Request

## 📄 Licença

MIT
