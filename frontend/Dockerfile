# Dockerfile para Frontend Angular
FROM node:18-alpine AS build

WORKDIR /app

# Instalar apenas as dependências essenciais do sistema
RUN apk add --no-cache git

# Configurar npm para máxima performance
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 3 && \
    npm config set fetch-retry-factor 1 && \
    npm config set fetch-timeout 30000 && \
    npm config set cache /tmp/.npm && \
    npm config set prefer-offline true

# Copiar package.json e package-lock.json (se existir)
COPY package*.json ./

# Instalar Angular CLI globalmente (opcional, útil para scripts)
RUN npm install -g @angular/cli@19.1.7 --no-audit --no-fund

# Instalar TODAS as dependências incluindo devDependencies (necessárias para build Angular)
# Usamos npm ci para builds reprodutíveis
RUN npm ci --no-audit --no-fund --silent

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