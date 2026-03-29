"""
===========================================
DAG PRINCIPAL - PIPELINE DE COMPLIANCE
===========================================

Pipeline orquestrado pelo Apache Airflow para:
1. Ingestão de dados brutos (Spark)
2. Transformação de dados (DBT)
3. Validação de qualidade (Great Expectations)
4. Carga em camada mart

Autor: Data Engineering Team
Data: 2026-03-29
"""

from datetime import datetime, timedelta
import logging

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.apache.spark.operators.spark_submit import (
    SparkSubmitOperator
)
from airflow.operators.dummy import DummyOperator
from airflow.utils.task_group import TaskGroup

# ===========================================
# CONFIGURAÇÕES PADRÃO
# ===========================================

default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'email': ['data-alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
    'start_date': datetime(2026, 3, 29),
    'catchup': False,
}

# ===========================================
# DEFINIÇÃO DA DAG
# ===========================================

dag = DAG(
    'pipeline_compliance',
    default_args=default_args,
    description=(
        'Pipeline principal de ingestão, transformação '
        'e validação de dados de compliance'
    ),
    schedule_interval='0 2 * * *',
    max_active_runs=1,
    tags=['compliance', 'production', 'critical'],
    doc_md="""
    # Pipeline de Compliance

    Pipeline ETL para processamento de dados de compliance.

    ## Fluxo
    1. **Ingestão**: Carrega dados brutos via Spark
    2. **Staging**: Cria views na camada staging (DBT)
    3. **Intermediate**: Transforma dados em tabelas intermediárias
    4. **Validação**: Executa testes de qualidade (Great Expectations)
    5. **Mart**: Carrega dados finais na camada mart
    6. **Auditoria**: Registra metadados de execução
    """,
)

# ===========================================
# FUNÇÕES AUXILIARES
# ===========================================

def log_execution_start(**context):
    """Registra início da execução do pipeline"""
    logging.info(
        f"Iniciando pipeline de compliance - "
        f"Execução: {context['execution_date']}"
    )
    logging.info(f"DAG Run ID: {context['dag_run'].run_id}")

    # Registrar metadados em tabela de auditoria
    execution_metadata = {
        'dag_id': context['dag'].dag_id,
        'execution_date': context['execution_date'].isoformat(),
        'run_id': context['dag_run'].run_id,
        'status': 'started',
        'started_at': datetime.now().isoformat(),
    }
    logging.info(f"Metadados de execução: {execution_metadata}")


def log_execution_end(**context):
    """Registra fim da execução do pipeline"""
    logging.info(
        f"Finalizando pipeline de compliance - "
        f"Execução: {context['execution_date']}"
    )

    execution_metadata = {
        'dag_id': context['dag'].dag_id,
        'execution_date': context['execution_date'].isoformat(),
        'run_id': context['dag_run'].run_id,
        'status': 'completed',
        'completed_at': datetime.now().isoformat(),
    }
    logging.info(f"Metadados de execução: {execution_metadata}")


def validate_ingestion_output(**context):
    """Valida se a ingestão foi bem-sucedida"""
    logging.info("Validando saída da ingestão...")
    # Lógica de validação seria implementada aqui
    # Por exemplo: verificar se arquivos foram criados
    return True


def check_data_quality(**context):
    """Verifica qualidade dos dados após transformação"""
    logging.info("Verificando qualidade dos dados...")
    # Integração com Great Expectations seria implementada aqui
    return True

# ===========================================
# DEFINIÇÃO DAS TASKS
# ===========================================

start = DummyOperator(
    task_id='start',
    dag=dag,
)

log_start = PythonOperator(
    task_id='log_execution_start',
    python_callable=log_execution_start,
    provide_context=True,
    dag=dag,
)

# Grupo de Ingestão
with TaskGroup("ingestion", dag=dag) as ingestion_group:

    ingest_raw_data = SparkSubmitOperator(
        task_id='ingest_raw_data',
        application=(
            '/opt/spark/jobs/ingestion/'
            'ingest_compliance_data.py'
        ),
        conn_id='spark_default',
        conf={
            'spark.executor.memory': '4g',
            'spark.driver.memory': '2g',
            'spark.executor.cores': '2',
            'spark.sql.shuffle.partitions': '10',
        },
        application_args=[
            '--date', '{{ ds }}',
            '--source', 'compliance_db',
            '--output', '/data/raw/compliance',
        ],
        dag=dag,
    )

    validate_ingestion = PythonOperator(
        task_id='validate_ingestion',
        python_callable=validate_ingestion_output,
        provide_context=True,
        dag=dag,
    )

    ingest_raw_data >> validate_ingestion

# Grupo de Transformação DBT
with TaskGroup("transformation", dag=dag) as transformation_group:

    dbt_run_staging = BashOperator(
        task_id='dbt_run_staging',
        bash_command=(
            'cd /opt/airflow/dbt && dbt run '
            '--select staging '
            '--vars \'{"processing_date": "{{ ds }}"}\''
        ),
        dag=dag,
    )

    dbt_test_staging = BashOperator(
        task_id='dbt_test_staging',
        bash_command=(
            'cd /opt/airflow/dbt && dbt test --select staging'
        ),
        dag=dag,
    )

    dbt_run_intermediate = BashOperator(
        task_id='dbt_run_intermediate',
        bash_command=(
            'cd /opt/airflow/dbt && dbt run '
            '--select intermediate '
            '--vars \'{"processing_date": "{{ ds }}"}\''
        ),
        dag=dag,
    )

    dbt_test_intermediate = BashOperator(
        task_id='dbt_test_intermediate',
        bash_command=(
            'cd /opt/airflow/dbt && '
            'dbt test --select intermediate'
        ),
        dag=dag,
    )

    dbt_run_staging >> dbt_test_staging >> dbt_run_intermediate >> dbt_test_intermediate

# Grupo de Validação
with TaskGroup("validation", dag=dag) as validation_group:

    run_great_expectations = BashOperator(
        task_id='run_great_expectations',
        bash_command=(
            'cd /opt/airflow/validation && '
            'great_expectations checkpoint run '
            'compliance_checkpoint'
        ),
        dag=dag,
    )

    check_quality = PythonOperator(
        task_id='check_data_quality',
        python_callable=check_data_quality,
        provide_context=True,
        dag=dag,
    )

    run_great_expectations >> check_quality

# Grupo de Carga Final
with TaskGroup("final_load", dag=dag) as final_load_group:

    dbt_run_mart = BashOperator(
        task_id='dbt_run_mart',
        bash_command=(
            'cd /opt/airflow/dbt && dbt run '
            '--select mart '
            '--vars \'{"processing_date": "{{ ds }}"}\''
        ),
        dag=dag,
    )

    dbt_test_mart = BashOperator(
        task_id='dbt_test_mart',
        bash_command=(
            'cd /opt/airflow/dbt && dbt test --select mart'
        ),
        dag=dag,
    )

    dbt_run_mart >> dbt_test_mart

log_end = PythonOperator(
    task_id='log_execution_end',
    python_callable=log_execution_end,
    provide_context=True,
    dag=dag,
)

end = DummyOperator(
    task_id='end',
    dag=dag,
    trigger_rule='all_success',
)

# ===========================================
# ORDEM DE EXECUÇÃO
# ===========================================

start >> log_start >> ingestion_group
ingestion_group >> transformation_group
transformation_group >> validation_group
validation_group >> final_load_group
final_load_group >> log_end >> end
