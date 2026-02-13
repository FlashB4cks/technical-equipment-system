#!/bin/bash

# Script simple para gestionar el sistema

COMMAND=$1

case $COMMAND in
    "start")
        echo "Iniciando sistema..."
        docker-compose up -d
        ;;
    "stop")
        echo "Deteniendo sistema..."
        docker-compose down
        ;;
    "restart")
        echo "Reiniciando sistema..."
        docker-compose restart
        ;;
    "logs")
        echo "Mostrando logs (Ctrl+C para salir)..."
        docker-compose logs -f app
        ;;
    "update")
        echo "Actualizando sistema..."
        git pull
        docker-compose build
        docker-compose up -d
        docker-compose run --rm setup
        ;;
    "reset-admin")
        echo "Restableciendo admin..."
        docker-compose run --rm setup
        ;;
    *)
        echo "Uso: ./manage.sh [comando]"
        echo "Comandos disponibles:"
        echo "  start       - Iniciar contenedores"
        echo "  stop        - Detener contenedores"
        echo "  restart     - Reiniciar contenedores"
        echo "  logs        - Ver logs en tiempo real"
        echo "  update      - Descargar cambios de git y reconstruir"
        echo "  reset-admin - Volver a crear/resetear admin"
        ;;
esac
