"""
===========================================
CONFIGURAÇÃO DE TESTES - DATA PIPELINE COMPLIANCE
===========================================

Fixtures e configurações compartilhadas para todos os testes.

Autor: Data Engineering Team
Data: 2026-03-29
"""

import os
import pytest
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
root_dir = Path(__file__).parent.parent
sys.path.insert(0, str(root_dir))


# ===========================================
# FIXTURES GLOBAIS
# ===========================================


@pytest.fixture(scope="session")
def project_root():
    """Retorna o diretório raiz do projeto"""
    return root_dir


@pytest.fixture(scope="session")
def test_data_dir(project_root):
    """Retorna o diretório de dados de teste"""
    return project_root / "tests" / "data"


@pytest.fixture(scope="session")
def sample_compliance_data():
    """Retorna dados de exemplo para testes de compliance"""
    return [
        {
            "id": "TXN001",
            "transaction_date": "2026-03-29 10:00:00",
            "entity_id": "ENT001",
            "entity_type": "COMPANY",
            "transaction_type": "TRANSFER",
            "amount": 10000.00,
            "currency": "BRL",
            "status": "COMPLETED",
            "risk_score": 25,
            "compliance_flags": [],
            "metadata": {"source": "test"},
            "created_at": "2026-03-29 10:00:00",
            "updated_at": "2026-03-29 10:00:00",
            "source_system": "TEST",
            "batch_id": "BATCH001"
        },
        {
            "id": "TXN002",
            "transaction_date": "2026-03-29 11:00:00",
            "entity_id": "ENT002",
            "entity_type": "PERSON",
            "transaction_type": "PAYMENT",
            "amount": 50000.00,
            "currency": "BRL",
            "status": "PENDING",
            "risk_score": 75,
            "compliance_flags": ["SUSPICIOUS"],
            "metadata": {"source": "test"},
            "created_at": "2026-03-29 11:00:00",
            "updated_at": "2026-03-29 11:00:00",
            "source_system": "TEST",
            "batch_id": "BATCH001"
        }
    ]

@pytest.fixture(scope="function")
def cleanup_test_files():
    """Fixture para limpar arquivos de teste após execução"""
    yield
    # Limpar arquivos de teste criados durante o teste
    test_dirs = [
        root_dir / "tests" / "output",
        root_dir / "tests" / "temp"
    ]
    for test_dir in test_dirs:
        if test_dir.exists():
            import shutil
            shutil.rmtree(test_dir)


# ===========================================
# CONFIGURAÇÕES DE AMBIENTE
# ===========================================


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Configura ambiente de teste"""
    # Definir variáveis de ambiente para teste
    os.environ["TESTING"] = "true"
    os.environ["LOG_LEVEL"] = "DEBUG"

    yield

    # Limpar variáveis de ambiente após testes
    if "TESTING" in os.environ:
        del os.environ["TESTING"]
    if "LOG_LEVEL" in os.environ:
        del os.environ["LOG_LEVEL"]

# ===========================================
# HELPERS
# ===========================================


def create_test_dataframe(spark, data):
    """Cria DataFrame de teste a partir de dicionário"""
    return spark.createDataFrame(data)


def assert_dataframe_equal(df1, df2, check_order=False):
    """Compara dois DataFrames"""
    if not check_order:
        df1 = df1.sort(df1.columns)
        df2 = df2.sort(df2.columns)

    assert df1.count() == df2.count(), "DataFrames tem numero diferente de linhas"
    assert set(df1.columns) == set(df2.columns), "DataFrames tem colunas diferentes"

    # Comparar dados
    df1_data = [row.asDict() for row in df1.collect()]
    df2_data = [row.asDict() for row in df2.collect()]

    if not check_order:
        df1_data = sorted(df1_data, key=lambda x: str(x))
        df2_data = sorted(df2_data, key=lambda x: str(x))

    assert df1_data == df2_data, (
        "Dados dos DataFrames são diferentes"
    )
