export interface Contacto {
  numero: string;
  tipo: 'Móvil' | 'Casa' | 'Trabajo' | 'Otro';
  activo: boolean;
}

export interface Estudiante {
  id: string;
  codigo: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: string;
  correo: string;
  direccion: string;
  carrera: string;
  contactos: Contacto[];
  fechaRegistro: string;
}

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  carreraId: string;
  semestre?: string;
  descripcion?: string;
}

export interface Inscripcion {
  id: string;
  estudianteId: string;
  periodoId: string;
  cursoIds: string[];
  jornada?: string;
  modalidad?: string;
  estado: 'Borrador' | 'Registrada' | 'En revisión' | 'Aprobada' | 'Rechazada' | 'Cancelada';
  fecha: string;
}

export interface Periodo {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Catalogos {
  generos: string[];
  carreras: { id: string; nombre: string }[];
  jornadas: string[];
  modalidades: string[];
  estados: string[];
  periodos: Periodo[];
  cursos: Curso[];
}

export interface Respaldo {
  version: number;
  exportadoEn: string;
  estudiantes: Estudiante[];
  inscripciones: Inscripcion[];
}
