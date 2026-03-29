# Guia de Contribuição - Data Pipeline Compliance

Este documento descreve o processo de contribuição para o projeto de pipeline de dados de compliance.

## 📋 Visão Geral

Este projeto segue o protocolo **Modus Operandi Skill** para garantir:
- Implementação modular e atômica
- Documentação completa via Issues, Branches e Pull Requests
- Controle de qualidade e rastreabilidade
- Código limpo e manutenível

## 🔄 Fluxo de Contribuição

### 1. Criar Issue
Antes de iniciar qualquer trabalho, criar uma Issue no GitHub:

**Título**: Descritivo e objetivo
```
feat: Adicionar suporte a novos tipos de transação
fix: Corrigir validação de CPF/CNPJ
refactor: Otimizar queries de staging
test: Adicionar testes para camada intermediate
docs: Atualizar documentação de setup
```

**Corpo da Issue**:
```markdown
## Objetivo
Descrever claramente o que será implementado ou corrigido.

## Contexto
Explicar o motivo da mudança e como ela se encaixa no projeto.

## Requisitos
- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Requisito 3

## Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2

## Notas Adicionais
Qualquer informação relevante para a implementação.
```

### 2. Criar Branch
Criar branch a partir da main com nome descritivo:

```bash
# Sincronizar com repositório remoto
git pull origin main

# Criar branch
git checkout -b feature/nome-da-melhoria

# Ou para correções
git checkout -b fix/nome-do-bug

# Ou para refatoração
git checkout -b refactor/nome-da-refatoracao
```

**Convenção de nomes**:
- `feature/` - Novas funcionalidades
- `fix/` - Correção de bugs
- `refactor/` - Refatoração de código
- `test/` - Adição de testes
- `docs/` - Documentação
- `perf/` - Otimização de performance

### 3. Desenvolver e Commitar
Desenvolver a funcionalidade seguindo as boas práticas:

```bash
# Adicionar arquivos modificados
git add .

# Commitar com mensagem descritiva
git commit -m "feat: descrição clara da mudança"

# Push para branch remoto
git push origin feature/nome-da-melhoria
```

**Tipos de commit**:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `perf:` - Otimização de performance
- `refactor:` - Refatoração de código
- `test:` - Adição de testes
- `docs:` - Documentação
- `style:` - Formatação de código
- `chore:` - Tarefas de manutenção

### 4. Criar Pull Request
Após concluir o desenvolvimento, criar Pull Request:

**Título**: Mesmo formato do commit
```
feat: Adicionar suporte a novos tipos de transação
```

**Descrição**:
```markdown
## Resumo
Breve descrição das mudanças realizadas.

## Mudanças
- Lista de alterações principais
- Arquivos modificados
- Novas funcionalidades

## Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testes manuais realizados

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Revisão de código realizada

## Issue Relacionada
Closes #123
```

### 5. Revisão e Merge
- Aguardar revisão de pelo menos 1 reviewer
- Corrigir feedbacks se necessário
- Após aprovação, fazer merge para main

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
# Executar suite completa
./scripts/run_tests.sh
```

### Validação de Qualidade
```bash
# Verificar formatação
./scripts/check_format.sh

# Verificar linting
./scripts/check_lint.sh

# Verificar segurança
./scripts/check_security.sh
```

## 📝 Padrões de Código

### Scala
- Seguir Scalafmt para formatação
- Usar nomes descritivos
- Comentar lógica complexa
- Tratar exceções adequadamente

### SQL (DBT)
- Usar CTEs para legibilidade
- Padronizar nomes de colunas
- Documentar modelos
- Adicionar testes

### Python
- Seguir PEP 8
- Type hints quando possível
- Docstrings para funções
- Tratamento de erros

### YAML
- Indentação consistente (2 espaços)
- Comentários descritivos
- Validação de schema

## 🔍 Revisão de Código

### Checklist de Revisão
- [ ] Código segue padrões do projeto
- [ ] Testes unitários incluídos
- [ ] Documentação atualizada
- [ ] Sem código duplicado
- [ ] Tratamento de erros adequado
- [ ] Performance considerada
- [ ] Segurança validada
- [ ] Logs apropriados

### Feedback Construtivo
- Ser específico sobre problemas
- Sugerir soluções alternativas
- Reconhecer código de qualidade
- Manter tom profissional

## 🚀 Deploy

### Ambiente de Desenvolvimento
```bash
# Iniciar ambiente local
docker-compose up -d

# Executar pipeline
./scripts/run_pipeline_local.sh
```

### Ambiente de Staging
```bash
# Deploy para staging
./scripts/deploy_staging.sh

# Validar deploy
./scripts/validate_staging.sh
```

### Ambiente de Produção
```bash
# Deploy para produção (apenas após aprovação)
./scripts/deploy_production.sh

# Monitorar deploy
./scripts/monitor_production.sh
```

## 📚 Recursos

### Documentação
- [README](README.md) - Visão geral do projeto
- [Setup](docs/setup.md) - Guia de instalação
- [Architecture](docs/architecture.md) - Arquitetura detalhada

### Ferramentas
- [Apache Spark](https://spark.apache.org/docs/latest/)
- [DBT](https://docs.getdbt.com/)
- [Apache Airflow](https://airflow.apache.org/docs/)
- [Great Expectations](https://docs.greatexpectations.io/)
- [Delta Lake](https://docs.delta.io/)

### Contato
- **Data Engineering Team**: data-engineering@company.com
- **Slack**: #data-pipeline-support
- **GitHub Issues**: Para bugs e feature requests

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verificar documentação existente
2. Buscar Issues similares no GitHub
3. Criar nova Issue com detalhes
4. Contatar time via Slack

## 📄 Licença

Este projeto é licenciado sob a licença MIT. Veja [LICENSE](LICENSE) para detalhes.
