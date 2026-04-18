# Sistema de Gestión de Préstamos (Fact-Prest) 🚀

Un sistema profesional y moderno para la gestión de préstamos, clientes y pagos. Diseñado con una interfaz premium, oscura y totalmente responsiva, enfocado en la eficiencia y la facilidad de uso.

## ✨ Características Principales

- **Gestión de Clientes:** Registro completo de clientes con validaciones únicas (DNI/Cédula).
- **Control de Préstamos:** 
  - Soporte para interés simple y compuesto.
  - Términos flexibles (días, semanas, meses).
  - Cálculo automático de cuotas y saldos pendientes.
- **Seguimiento de Pagos:** Registro de abonos con diferentes métodos de pago (Efectivo, Transferencia, etc.).
- **Generación de Recibos:** Creación automática de comprobantes en PDF con diseño profesional.
- **Panel de Administración:** Visualización de métricas generales y estado de la cartera.
- **Diseño Premium:** Interfaz oscura basada en Glassmorphism con animaciones fluidas.
- **Seguridad:** Autenticación robusta y protección de rutas.

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos:** [MongoDB](https://www.mongodb.com/) (Atlas)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticación:** [NextAuth.js](https://next-auth.js.org/)
- **Estilos:** CSS3 Vanilla (Variables CSS & Modern Layouts)
- **Animaciones:** [Framer Motion](https://www.framer.com/motion/)
- **Iconos:** [Lucide React](https://lucide.dev/)
- **Reportes:** [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)

## ⚙️ Configuración del Entorno

Para ejecutar este proyecto, necesitarás configurar las siguientes variables de entorno en un archivo `.env`:

```env
DATABASE_URL="tu_url_de_mongodb"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu_secreto_para_auth"
```

## 📦 Instalación y Uso

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd sistema-prestamos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar la base de datos (Prisma):**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

5. **Construir para producción:**
   ```bash
   npm run build
   npm start
   ```

## 🚀 Despliegue

Este proyecto está optimizado para ser desplegado en [Vercel](https://vercel.com). Asegúrate de configurar las variables de entorno en el panel de control de Vercel y habilitar el acceso a tu clúster de MongoDB Atlas.

## 📄 Licencia

Este proyecto es de uso privado. Todos los derechos reservados.

---
Desarrollado con ❤️ para una gestión financiera impecable.
