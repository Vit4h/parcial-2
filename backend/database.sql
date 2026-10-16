IF DB_ID('RegistroEmpresa') IS NULL
    CREATE DATABASE RegistroEmpresa;
GO
USE RegistroEmpresa;
GO
IF OBJECT_ID('dbo.Empleados', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Empleados (
        IdEmpleado INT IDENTITY(1,1) PRIMARY KEY,
        Nombre VARCHAR(50) NOT NULL,
        Apellido VARCHAR(50) NOT NULL,
        Documento VARCHAR(25) NOT NULL UNIQUE,
        Puesto VARCHAR(80) NOT NULL,
        Departamento VARCHAR(80) NOT NULL,
        Correo VARCHAR(120) NOT NULL,
        Telefono VARCHAR(25) NOT NULL
    );
END;
GO
IF OBJECT_ID('dbo.Clientes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Clientes (
        IdCliente INT IDENTITY(1,1) PRIMARY KEY,
        Nombre VARCHAR(50) NOT NULL,
        Apellido VARCHAR(50) NOT NULL,
        Correo VARCHAR(120) NOT NULL,
        Telefono VARCHAR(25) NOT NULL,
        Empresa VARCHAR(100) NOT NULL
    );
END;
GO
