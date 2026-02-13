# Guía de Instalación en Servidor Local (Empresa)

Esta guía explica cómo desplegar el Sistema de Equipos Técnicos en un servidor interno de la empresa de la forma más sencilla posible.

## Requisitos Previos

El servidor debe tener instalado:
*   **Docker**
*   **Docker Compose**
*   **Git**

## Instalación Rápida

1.  **Clonar el repositorio** (o copiar la carpeta del proyecto al servidor):
    ```bash
    git clone https://github.com/FlashB4cks/technical-equipment-system.git
    cd technical-equipment-system
    ```

2.  **Dar permisos a los scripts:**
    
    ```bash
    sudo chmod +x install.sh manage.sh
    ```

3.  **Ejecutar el instalador automático:**
    ```bash
    ./install.sh
    ```

4.  **Seguir las instrucciones:**
    *   El script te preguntará la **IP** o **Dominio** del servidor (ej: `192.168.1.50` o `equipos.empresa.local`).
    *   Si no lo sabes, puedes dejarlo en blanco (usará `localhost`), pero para que otros accedan es mejor poner la IP.
    *   El script configurará todo automáticamente: Base de datos, Usuario Administrador y Seguridad.

## Acceso al Sistema

Una vez termine la instalación, podrás acceder desde cualquier navegador en la red:

*   **URL:** `http://<IP-DEL-SERVIDOR>:3000`
*   **Usuario Admin:** `admin@admin.com`
*   **Contraseña:** `admin123`

## Gestión del Sistema (Día a día)

Para facilitar el mantenimiento, usa el script `./manage.sh`.

### Ver estado / Logs
```bash
./manage.sh logs
```

### Reiniciar el sistema
```bash
./manage.sh restart
```

### Detener el sistema
```bash
./manage.sh stop
```

### Iniciar el sistema
```bash
./manage.sh start
```

### Actualizar (Si hay cambios en GitHub)
```bash
./manage.sh update
```

### Resetear Administrador (Si olvidan la clave)
```bash
./manage.sh reset-admin
```
*(Esto volverá a poner la clave `admin123` al usuario `admin@admin.com`).*

## Copias de Seguridad

Los datos se guardan en un volumen de Docker llamado `postgres_data`. Para hacer un backup, contacta al administrador de TI o utiliza herramientas estándar de backup de PostgreSQL.
