# Dockerfile para Frontend Angular
FROM node:18-alpine AS build

WORKDIR /app

# Configurar npm para ser mais rápido e confiável
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-timeout 60000

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar dependências com configurações otimizadas
RUN npm ci --no-audit --no-fund --prefer-offline --progress=false

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build --progress=false

# Estágio de produção com Nginx
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados do estágio anterior
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar o nginx
CMD ["nginx", "-g", "daemon off;"]