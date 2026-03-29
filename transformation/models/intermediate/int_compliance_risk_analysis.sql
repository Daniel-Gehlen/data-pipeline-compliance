/*
===========================================
MODELO INTERMEDIATE - ANÁLISE DE RISCO DE COMPLIANCE
===========================================

Modelo intermediate para análise de risco de compliance.
Agrega dados da camada staging com métricas de risco.

Camada: intermediate
Materialização: table
Tags: intermediate, compliance, risk

Autor: Data Engineering Team
Data: 2026-03-29
*/

{{
  config(
    materialized='table',
    schema='intermediate',
    tags=['intermediate', 'compliance', 'risk'],
    description='Análise de risco de compliance com métricas agregadas'
  )
}}

WITH staging_data AS (
    SELECT
        *
    FROM {{ ref('stg_compliance_transactions') }}
    WHERE processing_date = '{{ var("processing_date") }}'
),

-- ===========================================
-- ANÁLISE DE RISCO POR ENTIDADE
-- ===========================================
entity_risk_analysis AS (
    SELECT
        entity_id,
        entity_type,
        COUNT(*) AS total_transactions,
        SUM(amount_usd) AS total_amount_usd,
        AVG(risk_score) AS avg_risk_score,
        MAX(risk_score) AS max_risk_score,
        MIN(risk_score) AS min_risk_score,
        STDDEV(risk_score) AS stddev_risk_score,

        -- Contagem por nível de risco
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_risk_count,
        SUM(CASE WHEN risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_risk_count,
        SUM(CASE WHEN risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_risk_count,

        -- Percentual de risco alto
        ROUND(
            SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
            2
        ) AS high_risk_percentage,

        -- Transações que requerem revisão
        SUM(CASE WHEN requires_review THEN 1 ELSE 0 END) AS requires_review_count,

        -- Flags de compliance
        SUM(CASE WHEN array_contains(compliance_flags, 'SUSPICIOUS') THEN 1 ELSE 0 END) AS suspicious_count,

        -- Primeira e última transação
        MIN(transaction_date) AS first_transaction_date,
        MAX(transaction_date) AS last_transaction_date,

        -- Dias desde última transação
        DATEDIFF(day, MAX(transaction_date), CURRENT_DATE) AS days_since_last_transaction

    FROM staging_data
    GROUP BY entity_id, entity_type
),

-- ===========================================
-- ANÁLISE DE RISCO POR TIPO DE TRANSAÇÃO
-- ===========================================
transaction_type_risk_analysis AS (
    SELECT
        transaction_type,
        COUNT(*) AS total_transactions,
        SUM(amount_usd) AS total_amount_usd,
        AVG(risk_score) AS avg_risk_score,
        AVG(amount_usd) AS avg_amount_usd,

        -- Transações de alto valor
        SUM(CASE WHEN amount_usd > 100000 THEN 1 ELSE 0 END) AS high_value_count,
        SUM(CASE WHEN amount_usd > 500000 THEN 1 ELSE 0 END) AS very_high_value_count,

        -- Percentual de transações de alto valor
        ROUND(
            SUM(CASE WHEN amount_usd > 100000 THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
            2
        ) AS high_value_percentage

    FROM staging_data
    GROUP BY transaction_type
),

-- ===========================================
-- ANÁLISE TEMPORAL
-- ===========================================
temporal_analysis AS (
    SELECT
        DATE(transaction_date) AS transaction_date,
        COUNT(*) AS daily_transaction_count,
        SUM(amount_usd) AS daily_amount_usd,
        AVG(risk_score) AS daily_avg_risk_score,

        -- Média móvel de 7 dias
        AVG(COUNT(*)) OVER (
            ORDER BY DATE(transaction_date)
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) AS moving_avg_7d_transactions,

        -- Média móvel de 30 dias
        AVG(COUNT(*)) OVER (
            ORDER BY DATE(transaction_date)
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) AS moving_avg_30d_transactions

    FROM staging_data
    GROUP BY DATE(transaction_date)
),

-- ===========================================
-- ENTIDADES DE ALTO RISCO
-- ===========================================
high_risk_entities AS (
    SELECT
        entity_id,
        entity_type,
        total_transactions,
        total_amount_usd,
        avg_risk_score,
        high_risk_count,
        high_risk_percentage,
        requires_review_count,
        suspicious_count,

        -- Classificação de risco
        CASE
            WHEN high_risk_percentage >= 50 THEN 'CRITICAL'
            WHEN high_risk_percentage >= 30 THEN 'HIGH'
            WHEN high_risk_percentage >= 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END AS entity_risk_classification,

        -- Score de risco composto (0-100)
        ROUND(
            (avg_risk_score * 0.4) +
            (high_risk_percentage * 0.3) +
            (requires_review_count * 0.2) +
            (suspicious_count * 0.1),
            2
        ) AS composite_risk_score

    FROM entity_risk_analysis
    WHERE avg_risk_score >= 50
       OR high_risk_percentage >= 20
       OR requires_review_count > 0
       OR suspicious_count > 0
),

-- ===========================================
-- DADOS FINAIS
-- ===========================================
final AS (
    SELECT
        -- Metadados
        '{{ var("processing_date") }}' AS processing_date,
        CURRENT_TIMESTAMP AS dbt_loaded_at,
        '{{ invocation_id }}' AS dbt_invocation_id,

        -- Dados de risco por entidade
        era.entity_id,
        era.entity_type,
        era.total_transactions,
        era.total_amount_usd,
        era.avg_risk_score,
        era.max_risk_score,
        era.min_risk_score,
        era.stddev_risk_score,
        era.high_risk_count,
        era.medium_risk_count,
        era.low_risk_count,
        era.high_risk_percentage,
        era.requires_review_count,
        era.suspicious_count,
        era.first_transaction_date,
        era.last_transaction_date,
        era.days_since_last_transaction,

        -- Classificação de risco da entidade
        COALESCE(hre.entity_risk_classification, 'LOW') AS entity_risk_classification,
        COALESCE(hre.composite_risk_score, 0) AS composite_risk_score,

        -- Flags de alerta
        CASE
            WHEN era.high_risk_percentage >= 50 THEN TRUE
            ELSE FALSE
        END AS is_critical_risk,

        CASE
            WHEN era.requires_review_count > 0 THEN TRUE
            ELSE FALSE
        END AS has_pending_reviews,

        CASE
            WHEN era.suspicious_count > 0 THEN TRUE
            ELSE FALSE
        END AS has_suspicious_activity,

        CASE
            WHEN era.days_since_last_transaction > 90 THEN TRUE
            ELSE FALSE
        END AS is_inactive_entity

    FROM entity_risk_analysis era
    LEFT JOIN high_risk_entities hre
        ON era.entity_id = hre.entity_id
        AND era.entity_type = hre.entity_type
)
