# Registro de empleados y clientes — React + Vite + Express + SQL Server + Docker

Proyecto CRUD con registro, consulta, búsqueda, edición y eliminación de **empleados** y **clientes**.

## Requisitos

- Docker Desktop (con Docker Compose).
- Memoria suficiente para SQL Server; recomienda al menos 4 GB disponibles para Docker.

## Iniciar con Docker

1. Descomprime el ZIP y abre la carpeta `registro-empresa` en VS Code.
2. En la terminal Git Bash, crea tu archivo de configuración:

   ```bash
   cp .env.example .env
   ```

3. Edita `.env` y cambia `MSSQL_SA_PASSWORD` por una contraseña segura propia.
4. Inicia los contenedores:

   ```bash
   docker compose up -d --build
   ```

5. Revisa:

   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

6. Abre **http://localhost:5173** para usar React.

La API también estará disponible en **http://localhost:3000/api/empleados** y **http://localhost:3000/api/clientes**.

**Importante:** SQL Server puede tardar en iniciar. El backend espera la conexión y crea automáticamente la base `RegistroEmpresa` y las tablas `Empleados` y `Clientes` si no existen. No necesitas importar `database.sql` para esta versión Docker.

## Contenedores y puertos

| Servicio | Nombre | Puerto host | Puerto interno |
|---|---|---|---|
| Vite + React | `registro-frontend` | 5173 | 5173 |
| Express | `registro-backend` | 3000 | 3000 |
| SQL Server 2022 | `registro-sqlserver` | 1433 | 1433 |

La red `registro_network` se crea automáticamente. Vite redirige `/api` a `backend:3000`; el backend usa `sqlserver:1433`. Esos nombres se resuelven mediante DNS interno de Docker.

## Comandos útiles

```bash
docker compose ps               # Estado de los tres servicios
docker compose logs -f backend  # Errores y conexión a SQL Server
docker compose logs -f sqlserver
docker compose down             # Detener conservando datos
docker compose up -d --build    # Reconstruir e iniciar
docker compose down -v          # ADVERTENCIA: borra los datos de SQL Server
```

## Probar con Postman

- `GET http://localhost:3000/api/empleados`
- `GET http://localhost:3000/api/clientes`
- `POST http://localhost:3000/api/empleados` con Body → raw → JSON:

```json
{
  "Nombre": "Ana",
  "Apellido": "López",
  "Documento": "1234567890101",
  "Puesto": "Analista",
  "Departamento": "Tecnología",
  "Correo": "ana@example.com",
  "Telefono": "5555-1234"
}
```

- `POST http://localhost:3000/api/clientes` con Body → raw → JSON:

```json
{
  "Nombre": "Carlos",
  "Apellido": "Pérez",
  "Correo": "carlos@example.com",
  "Telefono": "5555-6789",
  "Empresa": "Comercial XYZ"
}
```

## Notas

- `.env` no debe subirse a Git.
- Esta configuración está orientada a laboratorio/desarrollo y publica SQL Server y Express localmente. Para producción usa proxy HTTPS, autenticación, restricciones de red y credenciales administradas.
- Si ya tienes puertos 1433, 3000 o 5173 ocupados por otros programas, cambia el lado izquierdo del mapeo de puertos en Compose.
