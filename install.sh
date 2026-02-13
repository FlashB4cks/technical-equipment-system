#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Instalador de Technical Equipment System ===${NC}"
echo "Este script configurará todo lo necesario para desplegar el sistema."
echo ""

# 1. Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker no está instalado. Por favor instálalo primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose no está instalado."
    exit 1
fi

# 2. Preguntar Configuración Básica
echo "--- Configuración ---"
read -p "Ingresa la IP o Dominio del servidor (default: localhost): " HOST_URL
HOST_URL=${HOST_URL:-localhost}

echo "Generando contraseñas seguras..."
DB_PASSWORD=$(openssl rand -base64 12)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
DB_USER="admin_equipos"
DB_NAME="technical_equipment"

# 3. Crear archivo .env
echo ""
echo "Creando archivo de configuración (.env)..."

cat > .env <<EOL
# Configuración Generada Automáticamente
HOST_URL=${HOST_URL}
PORT=3000

# Base de Datos
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# URLs de Conexión (Interna para Docker)
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}
POSTGRES_URL_NON_POOLING=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

# NextAuth
NEXTAUTH_URL=http://${HOST_URL}:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Entorno
NODE_ENV=production
EOL

echo -e "${GREEN}Archivo .env creado exitosamente.${NC}"

# 4. Iniciar Servicios
echo ""
echo "--- Iniciando Servicios con Docker ---"
echo "Esto puede tardar unos minutos la primera vez mientras se descargan las imágenes..."
docker-compose up -d --build

# 5. Configurar Base de Datos
echo ""
echo "--- Configurando Base de Datos ---"
echo "Esperando a que la base de datos esté lista..."
sleep 10
echo "Ejecutando migraciones y creando administrador..."
docker-compose run --rm setup

# 6. Finalizar
echo ""
echo -e "${GREEN}=== ¡Instalación Completada! ===${NC}"
echo ""
echo "El sistema debería estar accesible en:"
echo -e "${BLUE}http://${HOST_URL}:3000${NC}"
echo ""
echo "Credenciales de Administrador por defecto:"
echo "Email: admin@admin.com"
echo "Password: admin123"
echo ""
echo "Para ver los logs, ejecuta: ./manage.sh logs"
echo "Para detener el sistema: ./manage.sh stop"

# Dar permisos de ejecución al script de gestión
chmod +x manage.sh
