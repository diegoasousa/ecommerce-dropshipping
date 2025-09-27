#!/bin/bash
# ==============================================
# SCRIPT DE DEPLOY OTIMIZADO - FRONTEND ANGULAR
# ==============================================
# Build local + deploy otimizado para Oracle Cloud

set -e

APP_DIR="/opt/ecommerce"
REPO_URL="https://github.com/diegoasousa/ecommerce-dropshipping.git"
BRANCH="main"

echo "🚀 Iniciando deploy OTIMIZADO do frontend Angular..."

# Ir para diretório da aplicação
cd $APP_DIR

# Se já existe um clone, fazer pull; senão, clonar
if [ -d "ecommerce-dropshipping" ]; then
    echo "📥 Atualizando código..."
    cd ecommerce-dropshipping
    git pull origin $BRANCH
else
    echo "📥 Clonando repositório..."
    git clone $REPO_URL
    cd ecommerce-dropshipping
fi

# Ir para o diretório frontend
cd frontend

echo "⚡ Usando estratégia de build OTIMIZADA..."

# Parar container existente
echo "🛑 Parando container existente..."
docker-compose -f docker-compose.fast.yml down --remove-orphans 2>/dev/null || true

# Usar Dockerfile otimizado
echo "🏗️ Usando build otimizado com cache..."
docker build -f Dockerfile.fast -t ecommerce-frontend-fast:latest .

# Executar container
echo "🚀 Iniciando container..."
docker run -d \
  --name ecommerce-frontend \
  --restart unless-stopped \
  -p 80:80 \
  ecommerce-frontend-fast:latest

# Aguardar container ficar saudável
echo "⏳ Aguardando container ficar saudável..."
sleep 15

# Verificar status
echo "📊 Status do container:"
docker ps | grep ecommerce-frontend || echo "❌ Container não encontrado"

# Teste de conectividade
echo "🔍 Testando conectividade..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend está respondendo!"
else
    echo "⚠️ Frontend pode não estar respondendo. Verificando logs..."
    docker logs ecommerce-frontend --tail=10
fi

echo ""
echo "✅ Deploy OTIMIZADO concluído!"
echo ""
echo "🔗 URLs de acesso:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend: http://$(curl -s ifconfig.me):3001/api"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker logs ecommerce-frontend -f"
echo "   Parar: docker stop ecommerce-frontend && docker rm ecommerce-frontend"
echo "   Reiniciar: docker restart ecommerce-frontend"
echo "   Status: docker ps | grep ecommerce-frontend"