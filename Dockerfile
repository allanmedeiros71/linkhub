# 1. ESTÁGIO DE DEPENDÊNCIAS (Base)
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# 2. ESTÁGIO DE DESENVOLVIMENTO (Usado localmente)
FROM base AS development
RUN npm install
COPY . .
# Porta do Vite para dev
EXPOSE 5173 
# Porta do Express para dev
EXPOSE 5000 
CMD ["npm", "run", "dev"]

# 3. ESTÁGIO DE BUILD (Transforma código em arquivos estáticos)
FROM base AS build
RUN npm install --include=dev
COPY . .
RUN npm run build

# 4. ESTÁGIO DE PRODUÇÃO (O que vai para a Hostinger)
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copiamos apenas o necessário do estágio de build (segurança e leveza)
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/server.js ./

# Instala apenas dependências de runtime (sem Vite, Tailwind, etc.)
RUN npm install --omit=dev

EXPOSE 5000
CMD ["node", "server.js"]