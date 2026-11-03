import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Estudiantes } from './pages/estudiantes/estudiantes';
import { EstudianteForm } from './pages/estudiante-form/estudiante-form';
import { Inscripciones } from './pages/inscripciones/inscripciones';
import { InscripcionForm } from './pages/inscripcion-form/inscripcion-form';
import { CatalogoCursos } from './pages/catalogo-cursos/catalogo-cursos';
import { Respaldos } from './pages/respaldos/respaldos';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'estudiantes', component: Estudiantes },
  { path: 'estudiantes/nuevo', component: EstudianteForm },
  { path: 'estudiantes/editar/:id', component: EstudianteForm },
  { path: 'inscripciones', component: Inscripciones },
  { path: 'inscripciones/nueva', component: InscripcionForm },
  { path: 'inscripciones/editar/:id', component: InscripcionForm },
  { path: 'cursos', component: CatalogoCursos },
  { path: 'respaldos', component: Respaldos },
  { path: '**', redirectTo: '' }
];
