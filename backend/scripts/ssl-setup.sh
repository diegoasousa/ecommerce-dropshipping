#!/bin/bash
# ==============================================
# SCRIPT DE CONFIGURAÇÃO SSL - LET'S ENCRYPT
# ==============================================
# Execute após configurar o domínio

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ Uso: ./ssl-setup.sh seu-dominio.com seu-email@exemplo.com"
    exit 1
fi

echo "🔒 Configurando SSL para $DOMAIN..."

# Instalar certbot
echo "📦 Instalando Certbot..."
sudo apt update
sudo apt install -y certbot

# Parar nginx temporariamente
echo "⏹️ Parando nginx..."
docker-compose -f docker-compose.prod.yml stop nginx

# Gerar certificado
echo "🆕 Gerando certificado SSL..."
sudo certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email

# Copiar certificados para diretório do projeto
echo "📋 Copiando certificados..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/
sudo chown $USER:$USER ./ssl/*.pem

# Atualizar nginx.conf para habilitar HTTPS
echo "⚙️ Atualizando configuração do nginx..."
sed -i "s/# server {/server {/g" nginx.conf
sed -i "s/seu-dominio.com/$DOMAIN/g" nginx.conf
sed -i "s/# }/}/g" nginx.conf
sed -i "s/# return 301/return 301/g" nginx.conf

# Reiniciar containers
echo "🔄 Reiniciando containers..."
docker-compose -f docker-compose.prod.yml up -d

# Configurar renovação automática
echo "🔄 Configurando renovação automática..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f $APP_DIR/ecommerce-dropshipping/backend/docker-compose.prod.yml restart nginx") | crontab -

echo ""
echo "✅ SSL configurado com sucesso!"
echo "🔗 Seu site agora está disponível em: https://$DOMAIN"
echo "📱 Configure BACKEND_URL=https://$DOMAIN/api no .env.production"
echo "🔄 Execute o deploy novamente após atualizar as URLs"