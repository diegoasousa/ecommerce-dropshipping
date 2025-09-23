# 🚀 Guia Completo: Deploy no Oracle Cloud Always Free

## 📋 Pré-requisitos
- Conta no Oracle Cloud (Always Free)
- Domínio próprio (opcional, mas recomendado)
- Chaves do Mercado Pago (produção ou sandbox)

## 🏗️ Parte 1: Criando a VPS no Oracle Cloud

### 1.1 Criar Compute Instance
1. Acesse [Oracle Cloud Console](https://cloud.oracle.com)
2. Vá em **Compute** → **Instances**
3. Clique em **Create Instance**
4. Configure:
   - **Name:** ecommerce-backend
   - **Image:** Ubuntu 22.04 LTS
   - **Shape:** VM.Standard.E2.1.Micro (Always Free)
   - **Boot Volume:** 50GB (máximo free)
   - **SSH Keys:** Faça upload da sua chave SSH pública

### 1.2 Configurar Rede e Firewall
1. Na criação da instância, em **Networking**:
   - Deixe **VCN** padrão
   - **Subnet:** Public Subnet
   - **Assign Public IP:** Sim

2. Após criar, vá em **Networking** → **Virtual Cloud Networks**
3. Clique na VCN padrão → **Security Lists** → **Default Security List**
4. Clique **Add Ingress Rules** e adicione:

```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 80
Description: HTTP

Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 443
Description: HTTPS

Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3001
Description: Backend API
```

## 🖥️ Parte 2: Configuração do Servidor

### 2.1 Conectar via SSH
```bash
# Comando específico para sua VM Oracle Cloud
ssh -i ~/.ssh/oracle_cloud_key ubuntu@SEU_IP_PUBLICO_ORACLE

### 2.2 Executar Script de Instalação
```bash
# Baixar o script de instalação
curl -fsSL https://raw.githubusercontent.com/diegoasousa/ecommerce-dropshipping/main/backend/scripts/install.sh -o install.sh

# Executar instalação
chmod +x install.sh
./install.sh

# Logout e login novamente (para aplicar permissões Docker)
exit
ssh -i ~/.ssh/oracle_cloud_key ubuntu@SEU_IP_PUBLICO_ORACLE

# Verificar Docker
docker --version
docker-compose --version
```

## 📁 Parte 3: Deploy da Aplicação

### 3.1 Baixar e Configurar Aplicação
```bash
# Ir para diretório da aplicação
cd /opt/ecommerce

# Clonar repositório
git clone https://github.com/diegoasousa/ecommerce-dropshipping.git
cd ecommerce-dropshipping/backend

# Copiar exemplo de ambiente
cp .env.production.example .env.production
```

### 3.2 Configurar Variáveis de Ambiente
```bash
# Editar arquivo de ambiente
nano .env.production
```

Configure as seguintes variáveis:
```env
# URLs (substitua SEU_DOMINIO ou use IP público)
BACKEND_URL=https://seudominio.com/api
FRONTEND_URL=https://seudominio.com

# Senhas seguras
DATABASE_PASSWORD=SuaSenhaSegura123!
JWT_SECRET=SeuJWTSecretSuperSeguro123!

# Suas chaves do Mercado Pago
MERCADO_PAGO_PUBLIC_KEY=APP_USR-sua-chave-publica
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-access-token
```

### 3.3 Executar Deploy
```bash
# Baixar script de deploy
curl -fsSL https://raw.githubusercontent.com/diegoasousa/ecommerce-dropshipping/main/backend/scripts/deploy.sh -o deploy.sh
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## 🌐 Parte 4: Configuração de Domínio (Opcional)

### 4.1 Configurar DNS
Se você tem um domínio, configure os registros DNS:
```
Tipo: A
Nome: @
Valor: SEU_IP_PUBLICO_ORACLE

Tipo: A
Nome: api
Valor: SEU_IP_PUBLICO_ORACLE
```

### 4.2 Configurar SSL (Let's Encrypt)
```bash
# Baixar script SSL
curl -fsSL https://raw.githubusercontent.com/diegoasousa/ecommerce-dropshipping/main/backend/scripts/ssl-setup.sh -o ssl-setup.sh
chmod +x ssl-setup.sh

# Executar configuração SSL
./ssl-setup.sh seudominio.com seu-email@exemplo.com

# Atualizar .env.production com HTTPS URLs
nano .env.production
# Altere para: BACKEND_URL=https://seudominio.com/api

# Deploy novamente
./deploy.sh
```

## 🧪 Parte 5: Testes

### 5.1 Verificar Aplicação
```bash
# Health check
curl http://SEU_IP_PUBLICO/health

# Configuração Mercado Pago
curl http://SEU_IP_PUBLICO/api/mercadopago/config

# Criar preferência de teste
curl -X POST http://SEU_IP_PUBLICO/api/mercadopago/create_preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"title": "Teste Oracle", "quantity": 1, "unit_price": 10.0}],
    "customer": {"name": "Teste", "email": "teste@teste.com"},
    "orderId": 1
  }'
```

### 5.2 Monitoramento
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Status containers
docker-compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats
```

## 🔧 Comandos Úteis

### Gerenciamento da Aplicação
```bash
# Restart aplicação
docker-compose -f docker-compose.prod.yml restart

# Parar aplicação
docker-compose -f docker-compose.prod.yml down

# Atualizar código e redeploy
git pull origin main
./deploy.sh

# Backup banco de dados
docker exec ecommerce_postgres pg_dump -U postgres ecommerce_dropshipping > backup.sql

# Restaurar banco de dados
docker exec -i ecommerce_postgres psql -U postgres ecommerce_dropshipping < backup.sql
```

### Monitoramento
```bash
# Ver uso de disco
df -h

# Ver logs do sistema
sudo journalctl -f

# Ver logs nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Ver logs backend
docker-compose -f docker-compose.prod.yml logs backend
```

## 🚨 Troubleshooting

### Problemas Comuns

**1. Containers não iniciam:**
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar recursos
free -h
df -h
```

**2. Banco não conecta:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker exec -it ecommerce_postgres psql -U postgres -d ecommerce_dropshipping
```

**3. Mercado Pago não recebe webhooks:**
- Verifique se as portas 80/443 estão abertas no Oracle Cloud Security List
- Verifique se BACKEND_URL está configurado corretamente
- Teste webhook manualmente

**4. SSL não funciona:**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

## 💰 Custos Oracle Cloud Always Free

**Recursos Inclusos (Sempre Grátis):**
- 2 VMs E2.1.Micro (1 core, 1GB RAM cada)
- 50GB boot volume + 50GB block volume
- 10TB outbound transfer/mês
- 2 Load Balancers

**Nossa Configuração Usa:**
- 1 VM E2.1.Micro (✅ Free)
- 50GB boot volume (✅ Free)
- Bandwidth normal (✅ Free)

**Total: R$ 0,00/mês** 🎉

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verifique o status: `docker-compose -f docker-compose.prod.yml ps`
3. Reinicie: `./deploy.sh`
4. Verifique firewall Oracle Cloud Security Lists