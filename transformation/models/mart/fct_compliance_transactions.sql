/*
===========================================
MODELO MART - TRANSAÇÕES DE COMPLIANCE
===========================================

Modelo mart para tabela fato de transações de compliance.
Dados finais otimizados para consumo por dashboards e relatórios.

Camada: mart
Materialização: table
Tags: mart, compliance, fact

Autor: Data Engineering Team
Data: 2026-03-29
*/

{{
  config(
    materialized='table',
    schema='mart',
    tags=['mart', 'compliance', 'fact'],
    description='Tabela fato de transações de compliance para consumo analítico'
  )
}}

WITH intermediate_data AS (
    SELECT
        *
    FROM {{ ref('int_compliance_risk_analysis') }}
    WHERE processing_date = '{{ var("processing_date") }}'
),

staging_data AS (
    SELECT
        *
    FROM {{ ref('stg_compliance_transactions') }}
    WHERE processing_date = '{{ var("processing_date") }}'
),

-- ===========================================
-- TABELA FATO DE TRANSAÇÕES
-- ===========================================
compliance_transactions_fact AS (
    SELECT
        -- Chaves primárias
        s.transaction_id,
        s.entity_id,
        s.entity_type,

        -- Dimensões de tempo
        s.transaction_date,
        DATE(s.transaction_date) AS transaction_date_key,
        EXTRACT(YEAR FROM s.transaction_date) AS transaction_year,
        EXTRACT(MONTH FROM s.transaction_date) AS transaction_month,
        EXTRACT(DAY FROM s.transaction_date) AS transaction_day,
        EXTRACT(HOUR FROM s.transaction_date) AS transaction_hour,
        EXTRACT(DOW FROM s.transaction_date) AS transaction_day_of_week,

        -- Dimensões de negócio
        s.transaction_type,
        s.currency,
        s.status,
        s.source_system,

        -- Métricas financeiras
        s.amount,
        s.amount_usd,

        -- Métricas de risco
        s.risk_score,
        s.risk_level,
        i.avg_risk_score AS entity_avg_risk_score,
        i.max_risk_score AS entity_max_risk_score,
        i.high_risk_percentage AS entity_high_risk_percentage,
        i.composite_risk_score AS entity_composite_risk_score,

        -- Flags de compliance
        s.compliance_flags,
        s.requires_review,
        i.is_critical_risk,
        i.has_pending_reviews,
        i.has_suspicious_activity,
        i.is_inactive_entity,

        -- Métricas agregadas da entidade
        i.total_transactions AS entity_total_transactions,
        i.total_amount_usd AS entity_total_amount_usd,
        i.high_risk_count AS entity_high_risk_count,
        i.medium_risk_count AS entity_medium_risk_count,
        i.low_risk_count AS entity_low_risk_count,
        i.requires_review_count AS entity_requires_review_count,
        i.suspicious_count AS entity_suspicious_count,

        -- Classificação de risco
        i.entity_risk_classification,

        -- Métricas de tempo
        i.first_transaction_date AS entity_first_transaction_date,
        i.last_transaction_date AS entity_last_transaction_date,
        i.days_since_last_transaction AS entity_days_since_last_transaction,

        -- Flags de qualidade
        s.has_negative_amount,
        s.has_invalid_risk_score,

        -- Metadados
        s.batch_id,
        s.processing_date,
        s.ingestion_timestamp,
        s.dbt_loaded_at,
        s.dbt_invocation_id,

        -- Metadados de processamento
        '{{ var("processing_date") }}' AS mart_processing_date,
        CURRENT_TIMESTAMP AS mart_loaded_at

    FROM staging_data s
    LEFT JOIN intermediate_data i
        ON s.entity_id = i.entity_id
        AND s.entity_type = i.entity_type
),

-- ===========================================
-- AGREGAÇÕES PARA DASHBOARDS
-- ===========================================
daily_summary AS (
    SELECT
        DATE(transaction_date) AS summary_date,
        COUNT(*) AS total_transactions,
        SUM(amount_usd) AS total_amount_usd,
        AVG(amount_usd) AS avg_amount_usd,
        AVG(risk_score) AS avg_risk_score,

        -- Contagem por nível de risco
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_risk_transactions,
        SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_risk_transactions,
        SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_risk_transactions,

        -- Transações que requerem revisão
        SUM(CASE WHEN requires_review THEN 1 ELSE 0 END) AS transactions_requiring_review,

        -- Transações com flags de compliance
        SUM(CASE WHEN array_contains(compliance_flags, 'SUSPICIOUS') THEN 1 ELSE 0 END) AS suspicious_transactions,

        -- Transações de alto valor
        SUM(CASE WHEN amount_usd > 100000 THEN 1 ELSE 0 END) AS high_value_transactions,

        -- Percentual de risco alto
        ROUND(
            SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
            2
        ) AS high_risk_percentage

    FROM compliance_transactions_fact
    GROUP BY DATE(transaction_date)
),

-- ===========================================
-- DADOS FINAIS
-- ===========================================
final AS (
    SELECT
        -- Incluir todas as colunas da tabela fato
        *
    FROM compliance_transactions_fact
)

SELECT * FROM final
