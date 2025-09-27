#!/bin/bash
# ==============================================
# BUILD LOCAL + DEPLOY REMOTO
# ==============================================
# Execute este script NA SUA MÁQUINA LOCAL (macOS)

set -e

echo "🏗️ Iniciando build local do frontend Angular..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório frontend/"
    exit 1
fi

# Instalar dependências localmente
echo "📦 Instalando dependências..."
npm install

# Build para produção
echo "🔧 Building para produção..."
npm run build

# Verificar se o build foi criado
if [ ! -d "dist/frontend" ]; then
    echo "❌ Build falhou - diretório dist/frontend não encontrado"
    exit 1
fi

echo "✅ Build local concluído!"
echo ""
echo "📤 Agora execute os seguintes comandos no SERVIDOR:"
echo ""
echo "# 1. Pare qualquer container rodando"
echo "docker stop ecommerce-frontend 2>/dev/null || true"
echo "docker rm ecommerce-frontend 2>/dev/null || true"
echo ""
echo "# 2. Execute o script de deploy estático"
echo "cd /opt/ecommerce/ecommerce-dropshipping/frontend"
echo "git pull origin main"
echo "chmod +x deploy-static.sh"
echo "./deploy-static.sh"
echo ""
echo "💡 Ou copie os arquivos buildados diretamente para o servidor"