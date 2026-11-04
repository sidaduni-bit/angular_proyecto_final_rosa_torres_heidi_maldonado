import { inject, Injectable, signal } from '@angular/core';
import { Estudiante, Inscripcion, Respaldo } from '../models/academic.models';
import { CatalogosService } from './catalogos.service';

// Claves utilizadas para guardar cada colección en el navegador.
const CLAVE_ESTUDIANTES = 'umes_estudiantes';
const CLAVE_INSCRIPCIONES = 'umes_inscripciones';

// Representa un objeto JSON sin validar. Sus propiedades son unknown hasta comprobarlas.
interface ObjetoRespaldo {
  [key: string]: unknown;
  version?: unknown;
  exportadoEn?: unknown;
  estudiantes?: unknown;
  inscripciones?: unknown;
  id?: unknown;
  codigo?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  fechaNacimiento?: unknown;
  genero?: unknown;
  correo?: unknown;
  direccion?: unknown;
  carrera?: unknown;
  fechaRegistro?: unknown;
  contactos?: unknown;
  numero?: unknown;
  tipo?: unknown;
  activo?: unknown;
  estudianteId?: unknown;
  periodoId?: unknown;
  cursoIds?: unknown;
  estado?: unknown;
  jornada?: unknown;
  modalidad?: unknown;
  fecha?: unknown;
}

@Injectable({ providedIn: 'root' })
export class RegistroService {
  private readonly catalogo = inject(CatalogosService).obtener();

  // Signals mantienen los datos sincronizados con las pantallas de Angular.
  readonly estudiantes = signal<Estudiante[]>(
    this.leer<Estudiante[]>(CLAVE_ESTUDIANTES, [])
  );
  readonly inscripciones = signal<Inscripcion[]>(
    this.leer<Inscripcion[]>(CLAVE_INSCRIPCIONES, [])
  );

  // Lee una colección guardada. Si no hay datos o el JSON no se puede leer,
  // inicia con el valor predeterminado para esa colección.
  private leer<T>(clave: string, valorInicial: T): T {
    try {
      const contenido = localStorage.getItem(clave);
      return contenido ? JSON.parse(contenido) as T : valorInicial;
    } catch {
      return valorInicial;
    }
  }

  // Persiste juntas las colecciones actuales de estudiantes e inscripciones.
  private guardar(): void {
    localStorage.setItem(CLAVE_ESTUDIANTES, JSON.stringify(this.estudiantes()));
    localStorage.setItem(CLAVE_INSCRIPCIONES, JSON.stringify(this.inscripciones()));
  }

  // Agrega un estudiante nuevo o actualiza el que ya tenga el mismo ID.
  guardarEstudiante(estudiante: Estudiante): void {
    const lista = this.estudiantes();
    const existe = lista.some(item => item.id === estudiante.id);

    this.estudiantes.set(
      existe
        ? lista.map(item => item.id === estudiante.id ? estudiante : item)
        : [...lista, estudiante]
    );
    this.guardar();
  }

  // Evita eliminar estudiantes que todavía tienen inscripciones no canceladas.
  eliminarEstudiante(id: string): boolean {
    const tieneInscripcionesActivas = this.inscripciones().some(
      item => item.estudianteId === id && item.estado !== 'Cancelada'
    );

    if (tieneInscripcionesActivas) return false;

    this.estudiantes.update(lista => lista.filter(item => item.id !== id));
    this.guardar();
    return true;
  }

  // Agrega una inscripción nueva o actualiza la que ya tenga el mismo ID.
  guardarInscripcion(inscripcion: Inscripcion): void {
    const lista = this.inscripciones();
    const existe = lista.some(item => item.id === inscripcion.id);

    this.inscripciones.set(
      existe
        ? lista.map(item => item.id === inscripcion.id ? inscripcion : item)
        : [...lista, inscripcion]
    );
    this.guardar();
  }

  // Elimina una inscripción y guarda el cambio en el almacenamiento local.
  eliminarInscripcion(id: string): void {
    this.inscripciones.update(lista => lista.filter(item => item.id !== id));
    this.guardar();
  }

  // Prepara un respaldo versionado con las colecciones actuales.
  // Completa jornada y modalidad en registros antiguos que no las tenían.
  crearRespaldo(): Respaldo {
    return {
      version: 1,
      exportadoEn: new Date().toISOString(),
      estudiantes: this.estudiantes(),
      inscripciones: this.inscripciones().map(inscripcion => ({
        ...inscripcion,
        jornada: inscripcion.jornada ?? this.catalogo.jornadas[0],
        modalidad: inscripcion.modalidad ?? this.catalogo.modalidades[0]
      }))
    };
  }

  // Comprueba la estructura completa del respaldo antes de permitir su importación.
  validarRespaldo(datos: unknown): datos is Respaldo {
    if (
      !this.esObjeto(datos) ||
      datos.version !== 1 ||
      !this.esFecha(datos.exportadoEn) ||
      !Array.isArray(datos.estudiantes) ||
      !Array.isArray(datos.inscripciones)
    ) {
      return false;
    }

    const carrerasPorEstudiante = new Map<string, string>();
    const codigosEstudiantes = new Set<string>();

    for (const estudiante of datos.estudiantes) {
      if (!this.esEstudianteValido(estudiante, carrerasPorEstudiante, codigosEstudiantes)) {
        return false;
      }
    }

    const idsInscripciones = new Set<string>();
    for (const inscripcion of datos.inscripciones) {
      if (!this.esInscripcionValida(inscripcion, carrerasPorEstudiante, idsInscripciones)) {
        return false;
      }
    }

    return true;
  }

  // Reemplaza el respaldo actual. Si falla el guardado, restaura ambos valores
  // anteriores para no dejar estudiantes e inscripciones desincronizados.
  reemplazarDatos(respaldo: Respaldo): void {
    const estudiantesPrevios = localStorage.getItem(CLAVE_ESTUDIANTES);
    const inscripcionesPrevias = localStorage.getItem(CLAVE_INSCRIPCIONES);

    try {
      localStorage.setItem(CLAVE_ESTUDIANTES, JSON.stringify(respaldo.estudiantes));
      localStorage.setItem(CLAVE_INSCRIPCIONES, JSON.stringify(respaldo.inscripciones));
    } catch (error) {
      try {
        this.restaurar(CLAVE_ESTUDIANTES, estudiantesPrevios);
        this.restaurar(CLAVE_INSCRIPCIONES, inscripcionesPrevias);
      } catch {
        throw new Error('Falló el guardado y no fue posible restaurar el almacenamiento anterior.');
      }
      throw error;
    }

    this.estudiantes.set(respaldo.estudiantes);
    this.inscripciones.set(respaldo.inscripciones);
  }

  // Valida los campos del estudiante, sus contactos y que no haya IDs o códigos repetidos.
  private esEstudianteValido(
    valor: unknown,
    carrerasPorEstudiante: Map<string, string>,
    codigosEstudiantes: Set<string>
  ): boolean {
    if (
      !this.esObjeto(valor) ||
      !this.esTexto(valor.id) ||
      !this.esTexto(valor.codigo) ||
      !/^EST-[0-9]{3,}$/i.test(valor.codigo) ||
      !this.esTexto(valor.nombres) ||
      valor.nombres.trim().length < 2 ||
      valor.nombres.trim().length > 60 ||
      !this.esTexto(valor.apellidos) ||
      valor.apellidos.trim().length < 2 ||
      valor.apellidos.trim().length > 60 ||
      !this.esFechaNacimiento(valor.fechaNacimiento) ||
      typeof valor.genero !== 'string' ||
      !this.catalogo.generos.includes(valor.genero) ||
      !this.esTexto(valor.correo) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.correo) ||
      !this.esTexto(valor.direccion) ||
      valor.direccion.trim().length < 5 ||
      valor.direccion.trim().length > 160 ||
      typeof valor.carrera !== 'string' ||
      !this.catalogo.carreras.some(carrera => carrera.nombre === valor.carrera) ||
      !this.esFecha(valor.fechaRegistro) ||
      !Array.isArray(valor.contactos) ||
      valor.contactos.length === 0
    ) {
      return false;
    }

    const codigoNormalizado = valor.codigo.toLowerCase();
    if (carrerasPorEstudiante.has(valor.id) || codigosEstudiantes.has(codigoNormalizado)) {
      return false;
    }

    for (const contacto of valor.contactos) {
      if (!this.esContactoValido(contacto)) return false;
    }

    const carrera = this.catalogo.carreras.find(item => item.nombre === valor.carrera);
    if (!carrera) return false;

    carrerasPorEstudiante.set(valor.id, carrera.id);
    codigosEstudiantes.add(codigoNormalizado);
    return true;
  }

  // Valida los datos de contacto antes de aceptar el estudiante.
  private esContactoValido(contacto: unknown): boolean {
    return (
      this.esObjeto(contacto) &&
      this.esTexto(contacto.numero) &&
      /^[0-9+() -]{8,20}$/.test(contacto.numero) &&
      typeof contacto.tipo === 'string' &&
      ['Móvil', 'Casa', 'Trabajo', 'Otro'].includes(contacto.tipo) &&
      typeof contacto.activo === 'boolean'
    );
  }

  // Comprueba los campos de inscripción y que estudiante, período y cursos existan.
  private esInscripcionValida(
    valor: unknown,
    carrerasPorEstudiante: Map<string, string>,
    idsInscripciones: Set<string>
  ): boolean {
    if (
      !this.esObjeto(valor) ||
      !this.esTexto(valor.id) ||
      !this.esTexto(valor.estudianteId) ||
      !this.esTexto(valor.periodoId) ||
      !Array.isArray(valor.cursoIds) ||
      valor.cursoIds.length === 0 ||
      typeof valor.estado !== 'string' ||
      !this.catalogo.estados.includes(valor.estado) ||
      (
        valor.jornada !== undefined &&
        (typeof valor.jornada !== 'string' || !this.catalogo.jornadas.includes(valor.jornada))
      ) ||
      (
        valor.modalidad !== undefined &&
        (typeof valor.modalidad !== 'string' || !this.catalogo.modalidades.includes(valor.modalidad))
      ) ||
      !this.esFecha(valor.fecha)
    ) {
      return false;
    }

    if (
      idsInscripciones.has(valor.id) ||
      !carrerasPorEstudiante.has(valor.estudianteId) ||
      !this.catalogo.periodos.some(periodo => periodo.id === valor.periodoId)
    ) {
      return false;
    }

    const cursosInscripcion = new Set<string>();
    const carreraEstudiante = carrerasPorEstudiante.get(valor.estudianteId);
    for (const cursoId of valor.cursoIds) {
      const curso = typeof cursoId === 'string'
        ? this.catalogo.cursos.find(item => item.id === cursoId)
        : undefined;
      if (
        typeof cursoId !== 'string' ||
        cursosInscripcion.has(cursoId) ||
        !curso ||
        curso.carreraId !== carreraEstudiante
      ) {
        return false;
      }
      cursosInscripcion.add(cursoId);
    }

    idsInscripciones.add(valor.id);
    return true;
  }

  // Restaura el valor previo de una clave, o la elimina si antes no existía.
  private restaurar(clave: string, valor: string | null): void {
    if (valor === null) {
      localStorage.removeItem(clave);
    } else {
      localStorage.setItem(clave, valor);
    }
  }

  // Type guarda para confirmar que un valor JSON es un objeto y no un arreglo.
  private esObjeto(valor: unknown): valor is ObjetoRespaldo {
    return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
  }

  // Confirma que el valor sea una cadena con contenido.
  private esTexto(valor: unknown): valor is string {
    return typeof valor === 'string' && valor.trim().length > 0;
  }

  // Acepta fechas ISO completas o fechas de calendario con formato AAAA-MM-DD.
  private esFecha(valor: unknown): valor is string {
    if (!this.esTexto(valor)) return false;

    if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      const fecha = new Date(`${valor}T00:00:00.000Z`);
      return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
    }

    if (!/^\d{4}-\d{2}-\d{2}T/.test(valor)) return false;

    const fecha = new Date(valor);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString() === valor;
  }

  // Valida que la fecha de nacimiento sea una fecha de calendario y no sea futura.
  private esFechaNacimiento(valor: unknown): valor is string {
    if (!this.esFecha(valor) || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      return false;
    }

    const hoy = new Date();
    const fechaActual = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0')
    ].join('-');

    return valor <= fechaActual;
  }
}
