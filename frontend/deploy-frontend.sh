#!/bin/bash
# ==============================================
# SCRIPT DE DEPLOY FRONTEND - ORACLE CLOUD
# ==============================================
# Execute este script para fazer deploy do frontend Angular

set -e

APP_DIR="/opt/ecommerce"
REPO_URL="https://github.com/diegoasousa/ecommerce-dropshipping.git"
BRANCH="main"

echo "🚀 Iniciando deploy do frontend Angular..."

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

# Parar container existente do frontend
echo "🛑 Parando container existente do frontend..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Remover imagem antiga do frontend
echo "🧹 Removendo imagem antiga do frontend..."
docker rmi ecommerce-frontend:latest || true
docker rmi frontend-frontend:latest || true

# Build e start do container do frontend
echo "🏗️ Construindo e iniciando container do frontend..."
docker-compose -f docker-compose.prod.yml up --build -d

# Aguardar container ficar saudável
echo "⏳ Aguardando container ficar saudável..."
sleep 30

# Verificar status do container
echo "📊 Status do container:"
docker-compose -f docker-compose.prod.yml ps

# Verificar logs
echo "📝 Últimos logs do frontend:"
docker-compose -f docker-compose.prod.yml logs --tail=20

# Teste de conectividade
echo "🔍 Testando conectividade..."
sleep 5
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend está respondendo!"
else
    echo "⚠️ Frontend pode não estar respondendo corretamente"
fi

echo ""
echo "✅ Deploy do frontend concluído!"
echo ""
echo "🔗 URLs de acesso:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend: http://$(curl -s ifconfig.me):3001/api"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Parar: docker-compose -f docker-compose.prod.yml down"
echo "   Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo "   Status: docker-compose -f docker-compose.prod.yml ps"
echo ""
echo "💡 Dica: Se houver problemas de CORS, verifique se o backend está configurado"
echo "         para aceitar requests do domínio do frontend"