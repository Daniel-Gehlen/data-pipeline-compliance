# Data Pipeline Compliance - Interface UI

Dashboard amigável e bonita para acessar todos os serviços do pipeline de compliance.

## 🎯 Funcionalidades

### Dashboard Principal
- **Visão Geral**: Métricas em tempo real do pipeline
- **Gráficos Interativos**: Transações por risco e volume diário
- **Status dos Serviços**: Monitoramento de todos os serviços
- **Atividade Recente**: Histórico de execuções

### Páginas Disponíveis

1. **Dashboard** - Visão geral com métricas e gráficos
2. **Pipeline** - Visualização do fluxo completo
3. **Airflow** - Orquestração e DAGs
4. **Spark** - Processamento distribuído
5. **Grafana** - Monitoramento e dashboards
6. **Jupyter** - Notebooks interativos
7. **PostgreSQL** - Banco de dados e queries
8. **Validação** - Great Expectations
9. **Configurações** - Preferências do sistema

## 🚀 Como Usar

### Iniciar o Servidor

```bash
# Navegue para o diretório da UI
cd ui

# Execute o servidor Python
python server.py

# Ou
python3 server.py
```

### Acessar a Interface

Abra seu navegador e acesse:
```
http://localhost:5000
```

## 📋 Requisitos

- Python 3.6+
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Serviços Docker rodando (para funcionalidade completa)

## 🎨 Características

### Design Moderno
- Interface limpa e profissional
- Cores consistentes e acessíveis
- Ícones Font Awesome
- Fonte Inter do Google Fonts

### Responsividade
- Layout adaptável para desktop, tablet e mobile
- Sidebar colapsável
- Grid system flexível

### Interatividade
- Navegação por abas
- Gráficos Chart.js
- Animações suaves
- Notificações toast
- Modais para ações
- Busca em tempo real

### Funcionalidades Técnicas
- Auto-refresh de dados (30 segundos)
- Atalhos de teclado (Ctrl+R, Esc)
- Persistência de preferências (localStorage)
- Hash navigation (#dashboard, #airflow, etc.)

## 🔗 Integração com Serviços

A UI se conecta aos seguintes serviços:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Airflow | http://localhost:8080 | Orquestração de pipelines |
| Spark | http://localhost:8081 | Processamento de dados |
| Grafana | http://localhost:3000 | Monitoramento |
| Jupyter | http://localhost:8888 | Notebooks |
| PostgreSQL | localhost:5432 | Banco de dados |
| Redis | localhost:6379 | Cache |

## 📁 Estrutura de Arquivos

```
ui/
├── index.html      # Página principal HTML
├── styles.css      # Estilos CSS
├── app.js          # JavaScript interativo
├── server.py       # Servidor HTTP Python
└── README.md       # Este arquivo
```

## 🎯 Funcionalidades por Página

### Dashboard
- Taxa de sucesso do pipeline
- Total de transações processadas
- Alertas de alto risco
- Tempo médio de processamento
- Gráfico de rosca (risco)
- Gráfico de linha (volume)
- Status de todos os serviços
- Lista de atividades recentes

### Pipeline
- Visualização do fluxo: Ingestão → Staging → Intermediate → Validação → Mart
- Status de cada etapa
- Detalhes da última execução
- Visualização da DAG do Airflow

### Airflow
- Estatísticas de DAGs
- Lista de DAGs recentes
- Status de execução
- Links diretos para a UI do Airflow

### Spark
- Status do cluster (Master/Worker)
- Jobs recentes
- Duração de execução
- Links para Spark Master UI

### Grafana
- Lista de dashboards disponíveis
- Links diretos para cada dashboard

### Jupyter
- Notebooks disponíveis
- Informações de diretórios
- Links para Jupyter Lab

### PostgreSQL
- Informações de conexão
- Lista de tabelas principais
- Editor de queries SQL
- Resultados de queries

### Validação
- Estatísticas de testes
- Resultados detalhados por teste
- Taxa de conformidade
- Botão para executar validação

### Configurações
- Toggle de atualização automática
- Toggle de notificações
- Seleção de tema
- URLs de serviços
- Botões de salvar/restaurar

## ⌨️ Atalhos de Teclado

- `Ctrl + R` - Atualizar dados
- `Esc` - Fechar modal

## 🔧 Personalização

### Temas
Suporta temas claro e escuro (configurável nas settings).

### Auto-refresh
Atualização automática de dados a cada 30 segundos (pode ser desativada).

## 📝 Notas

- Certifique-se de que todos os serviços Docker estão rodantes antes de usar
- Execute `docker-compose up -d` na raiz do projeto para iniciar os serviços
- A UI é uma interface de demonstração e pode ser expandida conforme necessário

## 🤝 Contribuição

Para melhorar a UI:
1. Identifique melhorias de UX/UI
2. Implemente as mudanças
3. Teste em diferentes navegadores
4. Envie um Pull Request

## 📄 Licença

MIT
