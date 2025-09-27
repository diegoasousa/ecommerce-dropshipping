#!/bin/bash
# ==============================================
# DEPLOY ESTÁTICO - SEM BUILD NO SERVIDOR
# ==============================================
# Execute no servidor Oracle Cloud

set -e

echo "🚀 Deploy estático do frontend (sem build no servidor)..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker stop ecommerce-frontend 2>/dev/null || true
docker rm ecommerce-frontend 2>/dev/null || true

# Criar diretório temporário para os arquivos
sudo mkdir -p /opt/ecommerce/frontend-static
sudo chown $USER:$USER /opt/ecommerce/frontend-static

# Se já existirem arquivos prontos em /opt/ecommerce/frontend-static, pular build/cópia
if [ -f "/opt/ecommerce/frontend-static/index.html" ]; then
    echo "✅ Arquivos estáticos já encontrados em /opt/ecommerce/frontend-static — pulando build/cópia."
else
    # Usar nginx diretamente com arquivos estáticos
    echo "📁 Preparando arquivos estáticos para o nginx..."

    # Se temos arquivos buildados localmente, usar eles
    if [ -d "dist/frontend/browser" ]; then
        echo "✅ Usando arquivos buildados encontrados (Angular 17+)..."
        cp -r dist/frontend/browser/* /opt/ecommerce/frontend-static/
    elif [ -d "dist/frontend" ] && [ -f "dist/frontend/index.html" ]; then
        echo "✅ Usando arquivos buildados encontrados (Angular <17)..."
        cp -r dist/frontend/* /opt/ecommerce/frontend-static/
    else
        echo "🏗️ Fazendo build simples no servidor..."
        
        # Tentar instalar apenas o Angular CLI
        npm install -g @angular/cli@latest --force --silent || echo "Usando ng global existente"
        
        # Tentar build direto sem npm ci
        if command -v ng >/dev/null 2>&1; then
            echo "📦 Angular CLI encontrado, fazendo build..."
            ng build --configuration=production --output-path=/opt/ecommerce/frontend-static
        else
            echo "❌ Angular CLI não disponível e nenhum build local encontrado. Use o build local."
            exit 1
        fi
    fi
fi

# Se temos arquivos buildados localmente, usar eles
# Verificar se temos arquivos para servir
if [ ! -f "/opt/ecommerce/frontend-static/index.html" ]; then
    echo "❌ Arquivos de build não encontrados em /opt/ecommerce/frontend-static/"
    echo "💡 Execute primeiro o build-local.sh na sua máquina local"
    exit 1
fi

# Executar nginx com volume
echo "🌐 Iniciando servidor nginx..."
docker run -d \
  --name ecommerce-frontend \
  --restart unless-stopped \
  -p 80:80 \
  -v /opt/ecommerce/frontend-static:/usr/share/nginx/html:ro \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine

# Aguardar e verificar
echo "⏳ Aguardando servidor iniciar..."
sleep 5

# Verificar status
echo "📊 Status do container:"
if docker ps | grep ecommerce-frontend > /dev/null; then
    echo "✅ Container rodando!"
else
    echo "❌ Container não está rodando. Verificando logs:"
    docker logs ecommerce-frontend
    exit 1
fi

# Teste de conectividade
echo "🔍 Testando conectividade..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend está respondendo!"
else
    echo "⚠️ Frontend pode não estar respondendo. Logs:"
    docker logs ecommerce-frontend --tail=10
fi

echo ""
echo "✅ Deploy estático concluído!"
echo ""
echo "🔗 URLs:"
echo "   Frontend: http://$(curl -s ifconfig.me)"
echo "   Backend: http://$(curl -s ifconfig.me):3001"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker logs ecommerce-frontend -f"
echo "   Parar: docker stop ecommerce-frontend"
echo "   Reiniciar: docker restart ecommerce-frontend"
echo "   Atualizar arquivos: cp -r dist/frontend/* /opt/ecommerce/frontend-static/ && docker restart ecommerce-frontend"