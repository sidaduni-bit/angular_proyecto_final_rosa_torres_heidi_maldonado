# UMES – Sistema de gestión de inscripciones universitarias

Aplicación académica desarrollada con Angular 20 y Angular Material para administrar estudiantes, cursos e inscripciones. Los registros creados se conservan en `localStorage`; los catálogos se leen desde un archivo JSON incluido en el proyecto.

## Requisitos

- Node.js compatible con Angular 20.
- npm.
- Navegador actualizado.

## Instalación y ejecución

```bash
npm install
npm start
```

Abrir `http://localhost:4200`.

Para compilar:

```bash
npm run build
```

## Estructura principal

```text
src/
├── app/
│   ├── app.ts
│   ├── app.html
│   ├── app.routes.ts
│   ├── data/catalogos.json
│   ├── models/academic.models.ts
│   ├── services/
│   │   ├── catalogos.service.ts
│   │   └── registro.service.ts
│   └── pages/
│       ├── inicio/
│       ├── estudiantes/
│       ├── estudiante-form/
│       ├── inscripciones/
│       ├── inscripcion-form/
│       ├── catalogo-cursos/
│       └── respaldos/
├── main.ts
└── styles.css
```

## Funcionalidades

- CRUD de estudiantes con búsqueda, validación y contactos en arreglo.
- Catálogo de cursos de sexto semestre para Ingeniería, Administración, Ciencias Jurídicas y Sociales y Comunicación, leído desde `src/app/data/catalogos.json`, con descripciones disponibles al seleccionar una materia.
- Registro, consulta, edición y cancelación de inscripciones, con jornada y modalidad obtenidas del catálogo.
- Búsqueda de inscripciones por nombre o código del estudiante, combinable con el filtro por estado o período.
- Filtrado de cursos por la carrera del estudiante seleccionado.
- Relaciones mediante identificadores entre estudiantes, períodos y cursos.
- Persistencia local mediante un servicio y `localStorage`.
- Exportación e importación de un respaldo JSON versionado.
- Validación de campos vacíos o compuestos solo por espacios; los textos se guardan recortados.
- Validación de tipos, campos requeridos, catálogos y correspondencia entre la carrera del estudiante y sus cursos antes de reemplazar datos.
- Rechazo de respaldos inválidos sin alterar los registros existentes.
- Formularios reactivos con controles Angular Material y mensajes de validación visibles.
- Diseño adaptable a pantallas pequeñas, con etiquetas visibles en la navegación móvil.

## Datos de demostración

El proyecto inicia sin estudiantes ni inscripciones. Para probarlo se pueden registrar nombres de ganadoras de certámenes de belleza como ejemplos ficticios de estudiantes: Fátima Bosch, Sheynnis Palacios, Andrea Meza, Catriona Gray, Harnaaz Sandhu, Pia Wurtzbach, Zozibini Tunzi y Victoria Kjær Theilvig. Son datos de demostración, no registros universitarios reales.

## Persistencia y respaldos

Los datos se guardan en el almacenamiento del navegador utilizado. Para moverlos a otro equipo, utilizar **Respaldos → Exportar datos** y después **Respaldos → Seleccionar archivo JSON** en el otro navegador. La importación reemplaza los registros existentes solo después de validar el archivo y solicitar confirmación.

## Notas para el equipo

- El proyecto utiliza componentes standalone, rutas, interfaces, interpolation, property binding, event binding, signals y `@for`.
- Para formularios de captura y edición se utiliza Reactive Forms, requisito expreso del proyecto final.
- Los accesos a `localStorage` están centralizados en `RegistroService`.
- Los catálogos son de solo lectura y se cargan desde JSON.
- Antes de entregar, cada integrante debe realizar commits reales y progresivos de su trabajo. No se incluye un historial Git ficticio en este ZIP.
- Revisar y probar los escenarios válidos e inválidos de importación/exportación y preparar la explicación individual del código.
