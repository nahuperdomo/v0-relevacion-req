FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar pnpm y dependencias
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copiar código fuente
COPY . .

# Compilar Next.js
RUN pnpm build

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["pnpm", "start"]
