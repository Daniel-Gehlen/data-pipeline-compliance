#!/usr/bin/env python3
"""
===========================================
SERVIDOR SIMPLES PARA UI DE COMPLIANCE
===========================================

Servidor HTTP simples para servir a interface UI
do Data Pipeline Compliance.

Uso:
    python server.py

    Ou:
    python3 server.py

Acesse:
    http://localhost:5000

Autor: Data Engineering Team
Data: 2026-03-30
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# ===========================================
# CONFIGURAÇÕES
# ===========================================

PORT = 5000
DIRECTORY = Path(__file__).parent
HOST = '0.0.0.0'

# ===========================================
# HANDLER PERSONALIZADO
# ===========================================

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado para servir arquivos estáticos"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        """Adiciona headers CORS e de cache"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Customiza logs do servidor"""
        print(f"[{self.log_date_time_string()}] {format % args}")

# ===========================================
# FUNÇÕES AUXILIARES
# ===========================================

def check_port_available(port):
    """Verifica se a porta está disponível"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind((HOST, port))
            return True
        except socket.error:
            return False

def find_available_port(start_port=5000, max_attempts=10):
    """Encontra uma porta disponível"""
    for port in range(start_port, start_port + max_attempts):
        if check_port_available(port):
            return port
    return None

def print_banner():
    """Imprime banner do servidor"""
    banner = """
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║         DATA PIPELINE COMPLIANCE - UI SERVER              ║
    ║                                                           ║
    ║         Servidor de Interface do Usuário                  ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)

def print_service_info(port):
    """Imprime informações dos serviços"""
    info = f"""
    ╔═══════════════════════════════════════════════════════════╗
    ║  SERVIÇOS DO PIPELINE DE COMPLIANCE                       ║
    ╠═══════════════════════════════════════════════════════════╣
    ║                                                           ║
    ║  🌐 Interface UI:      http://localhost:{port:<16}   ║
    ║                                                           ║
    ║  📊 Apache Airflow:    http://localhost:8080              ║
    ║  ⚡ Apache Spark:      http://localhost:8081              ║
    ║  📈 Grafana:           http://localhost:3000              ║
    ║  📓 Jupyter:           http://localhost:8888              ║
    ║  🐘 PostgreSQL:        localhost:5432                     ║
    ║  💾 Redis:             localhost:6379                     ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
    """
    print(info)

def print_instructions():
    """Imprime instruções de uso"""
    instructions = """
    📋 INSTRUÇÕES:

    1. Abra seu navegador web
    2. Acesse a URL da Interface UI mostrada acima
    3. Use o menu lateral para navegar entre as seções
    4. Clique nos botões de serviço para acessar cada ferramenta

    ⚠️  NOTA: Certifique-se de que todos os serviços Docker estão rodando
       Execute: docker-compose up -d

    🛑 Para parar o servidor: Ctrl+C
    """
    print(instructions)

# ===========================================
# SERVIDOR PRINCIPAL
# ===========================================

def run_server(port=PORT):
    """Inicia o servidor HTTP"""

    # Verifica se a porta está disponível
    if not check_port_available(port):
        print(f"⚠️  Porta {port} não está disponível.")
        new_port = find_available_port(port + 1)
        if new_port:
            print(f"✅ Usando porta alternativa: {new_port}")
            port = new_port
        else:
            print("❌ Nenhuma porta disponível encontrada.")
            sys.exit(1)

    # Configura o servidor
    with socketserver.TCPServer((HOST, port), CustomHTTPRequestHandler) as httpd:
        print_banner()
        print_service_info(port)
        print_instructions()

        print(f"🚀 Servidor iniciado em http://localhost:{port}")
        print(f"📁 Servindo arquivos de: {DIRECTORY}")
        print("=" * 60)

        try:
            # Inicia o servidor
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Servidor interrompido pelo usuário.")
            print("👋 Até logo!")
        except Exception as e:
            print(f"\n❌ Erro no servidor: {e}")
            sys.exit(1)

# ===========================================
# VERIFICAÇÃO DE ARQUIVOS
# ===========================================

def check_required_files():
    """Verifica se os arquivos necessários existem"""
    required_files = ['index.html', 'styles.css', 'app.js']
    missing_files = []

    for file in required_files:
        if not (DIRECTORY / file).exists():
            missing_files.append(file)

    if missing_files:
        print("❌ Arquivos não encontrados:")
        for file in missing_files:
            print(f"   - {file}")
        print("\nPor favor, certifique-se de que todos os arquivos estão presentes.")
        return False

    print("✅ Todos os arquivos necessários encontrados.")
    return True

# ===========================================
# PONTO DE ENTRADA
# ===========================================

if __name__ == '__main__':
    # Verifica arquivos necessários
    if not check_required_files():
        sys.exit(1)

    # Verifica argumentos da linha de comando
    if len(sys.argv) > 1:
        try:
            custom_port = int(sys.argv[1])
            run_server(custom_port)
        except ValueError:
            print("❌ Porta inválida. Usando porta padrão.")
            run_server()
    else:
        run_server()
