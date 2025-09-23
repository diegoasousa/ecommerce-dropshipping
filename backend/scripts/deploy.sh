#!/bin/bash
# ==============================================
# SCRIPT DE DEPLOY - ORACLE CLOUD
# ==============================================
# Execute este script para fazer deploy da aplicação

set -e

APP_DIR="/opt/ecommerce"
REPO_URL="https://github.com/diegoasousa/ecommerce-dropshipping.git"
BRANCH="main"

echo "🚀 Iniciando deploy da aplicação..."

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

# Ir para o diretório backend
cd backend

# Verificar se existe .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ ERRO: Arquivo .env.production não encontrado!"
    echo "📝 Crie o arquivo .env.production baseado no .env.production.example"
    echo "💡 Copie o exemplo: cp .env.production.example .env.production"
    echo "⚙️ Configure as variáveis: nano .env.production"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Limpar imagens antigas (opcional)
echo "🧹 Limpando imagens antigas..."
docker system prune -f

# Build e start dos containers
echo "🏗️ Construindo e iniciando containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Aguardar containers ficarem saudáveis
echo "⏳ Aguardando containers ficarem saudáveis..."
sleep 30

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
echo "📝 Últimos logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🔗 URLs de acesso:"
echo "   Backend: http://$(curl -s ifconfig.me)/api"
echo "   Health: http://$(curl -s ifconfig.me)/health"
echo "   Config: http://$(curl -s ifconfig.me)/api/mercadopago/config"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Parar: docker-compose -f docker-compose.prod.yml down"
echo "   Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "   Status: docker-compose -f docker-compose.prod.yml ps"