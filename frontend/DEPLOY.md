# 🚀 Deploy do Frontend Angular no Oracle Cloud

Este guia detalha como fazer o deploy do frontend Angular no seu servidor Oracle Cloud onde o backend já está rodando na porta 3001.

## 📋 Pré-requisitos

1. ✅ Servidor Oracle Cloud configurado com Docker
2. ✅ Backend rodando na porta 3001
3. ✅ Scripts de instalação inicial executados
4. ✅ Acesso SSH ao servidor

## 🔧 Configurações de Firewall Oracle Cloud

Certifique-se de que as seguintes portas estão abertas no Oracle Cloud Console:

1. Acesse o Oracle Cloud Console
2. Vá para **Compute > Instances**
3. Clique na sua instância
4. Vá para **Virtual Cloud Networks**
5. Clique na VCN da instância
6. Vá para **Security Lists**
7. Edite o Security List e adicione estas regras de **Ingress Rules**:

```
Source: 0.0.0.0/0
Protocol: TCP
Port Range: 80
Description: HTTP Frontend

Source: 0.0.0.0/0
Protocol: TCP
Port Range: 443
Description: HTTPS Frontend

Source: 0.0.0.0/0
Protocol: TCP
Port Range: 3001
Description: Backend API
```

## 🚀 Deploy do Frontend

### Passo 1: Conectar ao servidor

```bash
ssh -i ~/.ssh/oracle_cloud_key ubuntu@168.138.149.44
```

### Passo 2: Executar o deploy do frontend

```bash
# Ir para o diretório da aplicação
cd /opt/ecommerce

# Se ainda não clonou o repositório
git clone https://github.com/diegoasousa/ecommerce-dropshipping.git
cd ecommerce-dropshipping/frontend

# Ou se já existe, apenas atualizar
cd ecommerce-dropshipping
git pull origin main
cd frontend

# Dar permissão de execução ao script
chmod +x deploy-frontend.sh

# Executar o deploy
./deploy-frontend.sh
```

### Passo 3: Verificar o deploy

Após o deploy, você deve ver:

```
✅ Deploy do frontend concluído!

🔗 URLs de acesso:
   Frontend: http://168.138.149.44
   Backend: http://168.138.149.44:3001/api
```

### Passo 4: Testar a aplicação

1. **Frontend**: Abra http://168.138.149.44 no navegador
2. **Backend API**: Teste http://168.138.149.44:3001/health
3. **Comunicação**: Verifique se o frontend consegue fazer chamadas ao backend

## 🔍 Comandos Úteis para Monitoramento

```bash
# Ver status dos containers
cd /opt/ecommerce/ecommerce-dropshipping/frontend
docker-compose -f docker-compose.prod.yml ps

# Ver logs do frontend
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs apenas dos últimos minutos
docker-compose -f docker-compose.prod.yml logs --tail=50 -f

# Reiniciar o frontend
docker-compose -f docker-compose.prod.yml restart

# Parar o frontend
docker-compose -f docker-compose.prod.yml down

# Reconstruir e reiniciar (após mudanças no código)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🛠️ Solução de Problemas

### Problema: Frontend não carrega

**Solução:**
```bash
# Verificar se o container está rodando
docker ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs

# Verificar se a porta 80 está aberta
sudo ufw status
curl http://localhost:80
```

### Problema: CORS ao chamar API

**Solução:**
1. Verificar se o backend está configurado para aceitar requests de qualquer origem
2. Verificar se a URL do backend no `environment.prod.ts` está correta

### Problema: Build falha

**Solução:**
```bash
# Limpar imagens Docker antigas
docker system prune -f

# Reconstruir do zero
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
docker-compose -f docker-compose.prod.yml up --build -d
```

### Problema: Página em branco no Angular

**Solução:**
1. Verificar se os arquivos foram buildados corretamente
2. Verificar logs do nginx no container
3. Verificar se as rotas do Angular estão configuradas

## 📊 Monitoramento

### Verificar saúde do sistema
```bash
# Status de todos os containers
docker ps

# Uso de recursos
docker stats

# Espaço em disco
df -h
```

### Logs importantes
```bash
# Logs do sistema
sudo journalctl -fu docker

# Logs do frontend
docker-compose -f docker-compose.prod.yml logs frontend

# Logs do nginx dentro do container
docker exec ecommerce-frontend tail -f /var/log/nginx/access.log
docker exec ecommerce-frontend tail -f /var/log/nginx/error.log
```

## 🔄 Atualizações

Para atualizar o frontend após mudanças no código:

```bash
cd /opt/ecommerce/ecommerce-dropshipping
git pull origin main
cd frontend
./deploy-frontend.sh
```

## 🌐 URLs Finais

Após o deploy bem-sucedido:

- **Frontend**: http://168.138.149.44
- **Backend**: http://168.138.149.44:3001
- **API Health**: http://168.138.149.44:3001/health
- **API Config**: http://168.138.149.44:3001/api/mercadopago/config

## 🎉 Conclusão

O frontend Angular agora está rodando em produção no Oracle Cloud, servindo arquivos estáticos via Nginx e comunicando com o backend na porta 3001.