# ✂️ Trim Time - Sistema de Gestión de Citas para Barbería

![Trim Time Logo](./images/TrimTime.png)

**Trim Time** es una aplicación web moderna y completa para la gestión de citas en barberías. Ofrece una experiencia premium tanto para clientes como para administradores, con un diseño responsive que se adapta perfectamente a dispositivos móviles y de escritorio.

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Diseño Responsive](#-diseño-responsive)
- [Idiomas](#-idiomas)
- [Temas](#-temas)
- [Estructura de Datos](#-estructura-de-datos)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características

### Para Clientes
- 🔐 **Autenticación segura**: Sistema de login y registro
- 📅 **Reserva de citas**: Selección de servicio, barbero, fecha y hora
- 👤 **Perfil personalizable**: Gestión de datos personales y foto de perfil
- 📋 **Mis citas**: Visualización y gestión de citas programadas
- ⭐ **Sistema de calificaciones**: Califica a los barberos después del servicio
- 📱 **Diseño responsive**: Experiencia optimizada para móviles y tablets
- 🌙 **Modo oscuro/claro**: Tema personalizable
- 🌍 **Multiidioma**: Soporte para inglés y español

### Para Administradores
- 📊 **Panel de administración**: Dashboard con estadísticas en tiempo real
- 👥 **Gestión de barberos**: Agregar, editar y gestionar barberos
- ✂️ **Gestión de servicios**: Crear y modificar servicios ofrecidos
- 📅 **Gestión de citas**: Ver, confirmar, completar y cancelar citas
- 🔍 **Filtros avanzados**: Filtrar citas por fecha, servicio, barbero y estado
- 📈 **Estadísticas**: Visualización de ingresos, citas confirmadas y completadas
- 💬 **Mensajes**: Sistema de mensajería con clientes

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con variables CSS, flexbox, grid y media queries
- **JavaScript (ES6+)**: Lógica de la aplicación con módulos ES6
- **LocalStorage**: Almacenamiento local de datos (simulación de base de datos)
- **Sin frameworks**: Aplicación vanilla JavaScript para máximo rendimiento

## 📁 Estructura del Proyecto

```
TrimTime/
│
├── index.html                 # Página principal
├── css/
│   └── style.css             # Estilos principales (responsive)
│
├── js/
│   ├── app.js                # Lógica principal de la aplicación
│   │
│   ├── config/
│   │   └── appConfig.js      # Configuración de la aplicación
│   │
│   ├── controllers/
│   │   ├── adminController.js    # Controlador del panel de administración
│   │   ├── authController.js     # Controlador de autenticación
│   │   ├── bookingController.js  # Controlador de reservas
│   │   └── profileController.js   # Controlador de perfiles
│   │
│   ├── services/
│   │   ├── databaseService.js    # Servicio de base de datos (LocalStorage)
│   │   ├── translation.js        # Servicio de traducciones
│   │   └── raings.js             # Servicio de calificaciones
│   │
│   └── utils/
│       ├── constants.js          # Constantes de la aplicación
│       ├── dateUtils.js          # Utilidades de fecha y hora
│       └── uiUtils.js             # Utilidades de interfaz
│
├── images/                    # Imágenes y recursos visuales
│   ├── TrimTime.png
│   ├── TrimTime NObg.png
│   ├── Barbershop.png
│   └── ...
│
├── DESKTOP_DESIGN_ARCHITECTURE.md  # Documentación de diseño responsive
└── README.md                  # Este archivo
```

## 🚀 Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/TrimTime.git
   cd TrimTime
   ```

2. **Abrir en el navegador**:
   - Simplemente abre el archivo `index.html` en tu navegador web moderno
   - O usa un servidor local:
     ```bash
     # Con Python
     python -m http.server 8000
     
     # Con Node.js (http-server)
     npx http-server
     
     # Con PHP
     php -S localhost:8000
     ```

3. **Acceder a la aplicación**:
   - Abre tu navegador y ve a `http://localhost:8000`

## 📖 Uso

### Primer Acceso

1. **Registro de Administrador**:
   - En la página de registro, selecciona "Admin" como tipo de cuenta
   - O usa las credenciales por defecto:
     - Email: `admin@trimtime.com`
     - Password: (configurado en la inicialización)

2. **Registro de Cliente**:
   - Selecciona "Client" como tipo de cuenta
   - Completa el formulario de registro

### Flujo de Reserva de Cita

1. Inicia sesión como cliente
2. Haz clic en "Book Appointment"
3. Selecciona un servicio
4. Elige un barbero
5. Selecciona fecha y hora disponible
6. Confirma la reserva

### Panel de Administración

1. Inicia sesión como administrador
2. Accede al panel desde el botón de configuración (⚙️)
3. Gestiona barberos, servicios y citas desde las pestañas correspondientes

## 🎯 Funcionalidades Principales

### Sistema de Autenticación
- Login y registro de usuarios
- Roles: Cliente y Administrador
- Persistencia de sesión con LocalStorage

### Gestión de Citas
- Calendario interactivo con disponibilidad en tiempo real
- Filtros de disponibilidad por duración y horarios de barberos
- Validación de conflictos de horarios
- Estados: Pendiente, Confirmada, Completada, Cancelada

### Gestión de Barberos
- Perfiles con foto, nombre, horarios de trabajo y calificación
- Días y horarios de disponibilidad configurables
- Sistema de calificaciones por clientes

### Gestión de Servicios
- Servicios con nombre, descripción, duración y precio
- Soporte multiidioma para nombres y descripciones
- Imágenes asociadas a cada servicio

### Panel de Administración
- Dashboard con estadísticas en tiempo real
- Gestión completa de barberos (agregar, editar)
- Gestión completa de servicios (agregar, editar)
- Visualización y gestión de todas las citas
- Filtros avanzados para búsqueda de citas

## 📱 Diseño Responsive

La aplicación está completamente optimizada para diferentes tamaños de pantalla:

- **Móvil** (< 768px): Diseño vertical, navegación inferior, elementos compactos
- **Tablet/Desktop** (≥ 768px): Diseño premium con navegación flotante, espaciados amplios y efectos visuales mejorados

### Características del Diseño Responsive

- **Media Queries**: Separación clara entre estilos móvil y desktop
- **Navegación Adaptativa**: Barra horizontal en móvil, flotante en desktop
- **Grids Flexibles**: Adaptación automática de columnas según el tamaño de pantalla
- **Imágenes Responsive**: Optimización de tamaños y posicionamiento

Para más detalles, consulta [DESKTOP_DESIGN_ARCHITECTURE.md](./DESKTOP_DESIGN_ARCHITECTURE.md)

## 🌍 Idiomas

La aplicación soporta dos idiomas:

- **Inglés (en)**: Idioma por defecto
- **Español (es)**: Traducción completa

El cambio de idioma se realiza desde el botón de idioma en el header (🇬🇧/🇪🇸).

### Agregar Nuevos Idiomas

1. Edita `js/services/translation.js`
2. Agrega un nuevo objeto con las traducciones
3. Actualiza el selector de idioma en `js/app.js`

## 🎨 Temas

La aplicación incluye dos temas:

- **Modo Oscuro**: Tema por defecto con colores oscuros
- **Modo Claro**: Tema claro con colores claros

El cambio de tema se realiza desde el botón de tema en el header (🌙/☀️).

## 💾 Estructura de Datos

La aplicación utiliza **LocalStorage** para almacenar datos localmente. Los datos se organizan en las siguientes claves:

- `users`: Usuarios (clientes y administradores)
- `services`: Servicios ofrecidos
- `barbers`: Barberos y sus horarios
- `appointments`: Citas programadas
- `ratings`: Calificaciones de barberos
- `theme`: Tema actual (dark/light)
- `language`: Idioma actual (en/es)

### Inicialización de Datos

Al cargar la aplicación por primera vez, se inicializan datos de ejemplo:
- 1 usuario administrador
- Varios servicios predefinidos
- Varios barberos con horarios configurados

## 🔧 Personalización

### Cambiar Colores

Edita las variables CSS en `css/style.css`:

```css
:root {
    --primary-color: #d4af37;  /* Color dorado principal */
    --bg-color: #1a1a1a;        /* Color de fondo */
    --surface-color: #2a2a2a;   /* Color de superficie */
    /* ... más variables */
}
```

### Agregar Servicios o Barberos

1. Como administrador, accede al panel de administración
2. Usa los botones "Add Service" o "Add Barber"
3. Completa el formulario y guarda

## 🐛 Solución de Problemas

### Los datos no se guardan
- Verifica que tu navegador soporte LocalStorage
- Asegúrate de no estar en modo incógnito con restricciones

### Los estilos no se aplican correctamente
- Limpia la caché del navegador
- Verifica que todos los archivos CSS estén cargados

### El calendario no muestra disponibilidad
- Verifica que los barberos tengan horarios configurados
- Asegúrate de que los servicios tengan duración definida

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Notas de Desarrollo

- **Sin dependencias externas**: La aplicación es completamente vanilla JavaScript
- **Modular**: Código organizado en módulos ES6
- **Mantenible**: Estructura clara y comentarios descriptivos
- **Escalable**: Fácil agregar nuevas funcionalidades

## 🔮 Futuras Mejoras

- [ ] Integración con base de datos real (Firebase, MongoDB, etc.)
- [ ] Notificaciones push
- [ ] Sistema de pagos en línea
- [ ] Integración con calendarios externos (Google Calendar, etc.)
- [ ] App móvil nativa
- [ ] Sistema de recordatorios por email/SMS
- [ ] Historial de citas y estadísticas para clientes
- [ ] Sistema de cupones y promociones

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para barberías modernas.

---

**Trim Time** - *Tu barbería, tu estilo, tu tiempo.*

