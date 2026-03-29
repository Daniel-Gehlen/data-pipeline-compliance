/*
===========================================
MODELO STAGING - TRANSAÇÕES DE COMPLIANCE
===========================================

Modelo staging para limpeza e padronização inicial
dos dados brutos de transações de compliance.

Camada: staging
Materialização: view
Tags: staging, compliance

Autor: Data Engineering Team
Data: 2026-03-29
*/

{{
  config(
    materialized='view',
    schema='staging',
    tags=['staging', 'compliance'],
    description='View staging para transações de compliance com limpeza e padronização inicial'
  )
}}

WITH source AS (
    -- Selecionar dados brutos da camada raw
    SELECT
        *
    FROM {{ source('raw', 'compliance_transactions') }}
    WHERE processing_date = '{{ var("processing_date") }}'
),

cleaned AS (
    -- Limpeza e padronização básica
    SELECT
        -- Identificadores
        TRIM(id) AS transaction_id,
        TRIM(entity_id) AS entity_id,
        TRIM(batch_id) AS batch_id,

        -- Datas
        CAST(transaction_date AS TIMESTAMP) AS transaction_date,
        CAST(created_at AS TIMESTAMP) AS created_at,
        CAST(updated_at AS TIMESTAMP) AS updated_at,
        CAST(processing_date AS DATE) AS processing_date,

        -- Informações da entidade
        UPPER(TRIM(entity_type)) AS entity_type,

        -- Informações da transação
        UPPER(TRIM(transaction_type)) AS transaction_type,
        CAST(amount AS DECIMAL(18, 2)) AS amount,
        UPPER(TRIM(currency)) AS currency,
        CAST(amount_usd AS DECIMAL(18, 2)) AS amount_usd,

        -- Status e risco
        UPPER(TRIM(status)) AS status,
        CAST(risk_score AS INTEGER) AS risk_score,
        UPPER(TRIM(risk_level)) AS risk_level,

        -- Flags de compliance
        compliance_flags,
        CAST(requires_review AS BOOLEAN) AS requires_review,

        -- Metadados
        metadata,
        TRIM(source_system) AS source_system,
        CAST(ingestion_timestamp AS TIMESTAMP) AS ingestion_timestamp,

        -- Campos calculados para qualidade
        CASE
            WHEN id IS NULL OR TRIM(id) = '' THEN TRUE
            ELSE FALSE
        END AS has_invalid_id,

        CASE
            WHEN entity_id IS NULL OR TRIM(entity_id) = '' THEN TRUE
            ELSE FALSE
        END AS has_invalid_entity_id,

        CASE
            WHEN amount IS NOT NULL AND amount < 0 THEN TRUE
            ELSE FALSE
        END AS has_negative_amount,

        CASE
            WHEN risk_score IS NOT NULL AND (risk_score < 0 OR risk_score > 100) THEN TRUE
            ELSE FALSE
        END AS has_invalid_risk_score

    FROM source
),

validated AS (
    -- Filtrar registros inválidos críticos
    SELECT
        *
    FROM cleaned
    WHERE NOT has_invalid_id
      AND NOT has_invalid_entity_id
),

final AS (
    -- Selecionar colunas finais e adicionar metadados do modelo
    SELECT
        transaction_id,
        entity_id,
        batch_id,
        transaction_date,
        created_at,
        updated_at,
        processing_date,
        entity_type,
        transaction_type,
        amount,
        currency,
        amount_usd,
        status,
        risk_score,
        risk_level,
        compliance_flags,
        requires_review,
        metadata,
        source_system,
        ingestion_timestamp,

        -- Flags de qualidade (manter para auditoria)
        has_negative_amount,
        has_invalid_risk_score,

        -- Metadados do modelo
        CURRENT_TIMESTAMP AS dbt_loaded_at,
        '{{ invocation_id }}' AS dbt_invocation_id

    FROM validated
)

SELECT * FROM final
