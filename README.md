# Trim Time - Sistema de Gestión de Citas para Barbería


**Trim Time** es una aplicación web moderna y completa para la gestión de citas en barberías premium. Permite a los clientes reservar citas de forma sencilla y a los administradores gestionar servicios, barberos, citas y estadísticas de manera eficiente.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Funcionalidades](#-funcionalidades)
- [Configuración](#-configuración)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### Para Clientes
- 🔐 **Autenticación segura**: Sistema de registro e inicio de sesión
- 📅 **Reserva de citas**: Proceso intuitivo en 4 pasos (servicio, barbero, fecha/hora, confirmación)
- 👥 **Gestión de barberos**: Visualización de barberos disponibles con sus perfiles
- ✂️ **Catálogo de servicios**: Exploración de todos los servicios disponibles
- 📋 **Mis citas**: Visualización de citas próximas e historial
- ⭐ **Sistema de calificaciones**: Calificación de barberos y la aplicación
- 👤 **Perfil personalizable**: Gestión de información personal y preferencias
- 🌐 **Multiidioma**: Soporte para inglés y español
- 🌓 **Modo claro/oscuro**: Interfaz adaptable según preferencias
- 📱 **Diseño responsive**: Optimizado para dispositivos móviles y desktop
- 🔗 **Integración social**: Enlaces directos a Instagram, WhatsApp y Google Maps

### Para Administradores
- 📊 **Dashboard completo**: Panel de control con estadísticas en tiempo real
- 📅 **Calendario de citas**: Vista calendario con gestión de citas del día
- 📋 **Gestión de citas**: Filtrado avanzado y gestión de estados (pendiente, confirmada, completada, cancelada)
- ✂️ **Gestión de servicios**: Crear, editar y eliminar servicios
- 👥 **Gestión de barberos**: Administración completa de barberos y sus horarios
- ⭐ **Sistema de calificaciones**: Visualización de calificaciones de barberos y aplicación
- 📈 **Estadísticas**: Métricas de negocio (ingresos, citas, servicios más populares, horas pico)
- 💬 **Mensajes de clientes**: Gestión de mensajes de contacto de usuarios
- 🔍 **Filtros avanzados**: Búsqueda y filtrado por fecha, servicio, barbero, estado y cliente

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Arquitectura**: MVC (Model-View-Controller)
- **Almacenamiento**: LocalStorage (persistencia local)
- **Módulos**: ES6 Modules
- **Sin dependencias externas**: Aplicación vanilla JavaScript

## 📁 Estructura del Proyecto

```
TrimTime/
├── index.html              # Página principal
├── css/
│   └── style.css          # Estilos principales
├── js/
│   ├── app.js             # Punto de entrada de la aplicación
│   ├── config/
│   │   └── appConfig.js   # Configuración de la aplicación
│   ├── controllers/
│   │   ├── adminController.js    # Controlador del panel de administración
│   │   ├── authController.js    # Controlador de autenticación
│   │   ├── bookingController.js  # Controlador de reservas
│   │   └── profileController.js  # Controlador de perfil
│   ├── services/
│   │   ├── databaseService.js    # Servicio de base de datos (LocalStorage)
│   │   ├── raings.js             # Servicio de calificaciones
│   │   └── translation.js        # Servicio de traducciones
│   └── utils/
│       ├── constants.js          # Constantes de la aplicación
│       ├── dateUtils.js          # Utilidades de fecha y hora
│       └── uiUtils.js            # Utilidades de interfaz
├── images/                # Imágenes y recursos
└── README.md             # Este archivo
```

## 🚀 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/TrimTime.git
   cd TrimTime
   ```

2. **Abrir la aplicación**
   - Opción 1: Abrir `index.html` directamente en el navegador
   - Opción 2: Usar un servidor local (recomendado)
     ```bash
     # Con Python 3
     python -m http.server 8000
     
     # Con Node.js (http-server)
     npx http-server
     
     # Con PHP
     php -S localhost:8000
     ```

3. **Acceder a la aplicación**
   - Abrir el navegador en `http://localhost:8000`

## 💻 Uso

### Primera vez - Usuario Administrador

La aplicación viene con un usuario administrador por defecto:

- **Email**: `admin@trimtime.com`
- **Contraseña**: Se establece durante el primer registro (o revisar el código fuente)

### Flujo de Usuario Cliente

1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Explorar**: Ver servicios y barberos disponibles
3. **Reservar**: Seleccionar servicio → barbero → fecha/hora → confirmar
4. **Gestionar**: Ver y gestionar citas desde "Mis Citas"
5. **Calificar**: Después de una cita, calificar la experiencia

### Flujo de Usuario Administrador

1. **Login**: Iniciar sesión con credenciales de administrador
2. **Dashboard**: Acceder al panel de administración desde el botón ⚙️
3. **Gestionar**: Administrar servicios, barberos, citas y ver estadísticas
4. **Monitorear**: Revisar calificaciones y mensajes de clientes

## 🎯 Funcionalidades Detalladas

### Sistema de Reservas

- **Selección de servicio**: Visualización de servicios con precios y duraciones
- **Selección de barbero**: Elección de barbero preferido o automático
- **Calendario interactivo**: Selección de fecha con indicadores visuales
- **Horarios disponibles**: Filtrado inteligente de horarios según:
  - Disponibilidad del barbero
  - Duración del servicio
  - Horarios de trabajo
  - Citas existentes
- **Confirmación**: Resumen completo antes de confirmar

### Panel de Administración

- **Calendario**: Vista mensual con citas marcadas
- **Gestión de citas**: Cambio de estados, filtrado avanzado
- **Estadísticas**:
  - Total de citas
  - Citas confirmadas/completadas/canceladas
  - Ingresos totales
  - Servicios más populares
  - Horas pico
  - Filtros por rango de fechas
- **Gestión de contenido**: CRUD completo para servicios y barberos

### Personalización

- **Tema**: Modo claro u oscuro
- **Idioma**: Inglés o Español
- **Perfil**: Foto, información personal, preferencias
- **Notificaciones**: Configuración de preferencias de notificaciones

## ⚙️ Configuración

La configuración principal se encuentra en `js/config/appConfig.js`:

```javascript
{
    appName: 'Trim Time',
    version: '1.0.0',
    bookingTimeSlotDuration: 30,        // Duración de slots en minutos
    maxBookingDaysInAdvance: 30,         // Días máximos de anticipación
    workingHours: {
        start: '09:00',
        end: '18:00'
    },
    closedDays: [0],                     // 0 = Domingo
    supportedLanguages: ['en', 'es'],
    supportedThemes: ['dark', 'light']
}
```

### Personalización de Horarios

Los horarios de trabajo de cada barbero se pueden configurar desde el panel de administración.

### Personalización de Servicios

Los servicios se pueden agregar, editar o eliminar desde el panel de administración con:
- Nombre
- Descripción
- Precio
- Duración
- Imagen

## 📸 Capturas de Pantalla

> _Nota: Agregar capturas de pantalla de las principales funcionalidades_

## 🤝 Contribución

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas de Desarrollo

- **Almacenamiento**: Los datos se guardan en LocalStorage del navegador
- **Persistencia**: Los datos persisten entre sesiones del mismo navegador
- **Compatibilidad**: Compatible con navegadores modernos que soporten ES6+
- **Sin backend**: Aplicación completamente frontend, sin necesidad de servidor

## 🔒 Seguridad

- Las contraseñas se almacenan en texto plano en LocalStorage (solo para desarrollo)
- **IMPORTANTE**: Para producción, implementar autenticación segura con backend
- No usar datos sensibles reales en esta versión

## 📄 Licencia

Este proyecto es un Trabajo de Fin de Grado (TFG). Todos los derechos reservados por Francisco Sanz Torralvo.

## 👨‍💻 Autor

Desarrollado como parte de un Trabajo de Fin de Grado por Francisco Sanz Torralvo.


---

**Versión**: 1.0.0  
**Última actualización**: 2025

