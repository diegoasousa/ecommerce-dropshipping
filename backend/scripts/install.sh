#!/bin/bash
# ==============================================
# SCRIPT DE INSTALAÇÃO INICIAL - ORACLE CLOUD
# ==============================================
# Execute este script APENAS na primeira vez no servidor

set -e

echo "🚀 Iniciando configuração do servidor Oracle Cloud..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
echo "🛠️ Instalando dependências..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Docker
echo "🐳 Instalando Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose (standalone)
echo "📋 Instalando Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Node.js (para builds locais se necessário)
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable

# Criar diretórios para a aplicação
echo "📁 Criando estrutura de diretórios..."
sudo mkdir -p /opt/ecommerce
sudo chown $USER:$USER /opt/ecommerce
cd /opt/ecommerce

# Criar diretório para SSL
mkdir -p ssl uploads

echo "✅ Instalação inicial concluída!"
echo ""
echo "🔄 PRÓXIMOS PASSOS:"
echo "1. Faça logout e login novamente para aplicar as permissões do Docker"
echo "2. Execute: newgrp docker"
echo "3. Teste o Docker: docker --version"
echo "4. Execute o script de deploy: ./deploy.sh"
echo ""
echo "📝 LEMBRE-SE:"
echo "- Configure seu domínio para apontar para este servidor"
echo "- Configure as regras de firewall no Oracle Cloud Console"
echo "- Abra as portas 80, 443 e 3001 no Security List"