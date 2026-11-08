import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RegistroService } from '../../services/registro.service';
import { CatalogosService } from '../../services/catalogos.service';
import { Curso, Inscripcion } from '../../models/academic.models';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './inscripcion-form.html',
})
export class InscripcionForm {
  private readonly fb = inject(FormBuilder);
  private readonly registro = inject(RegistroService);
  private readonly catalogos = inject(CatalogosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly catalogo = this.catalogos.obtener();
  readonly estudiantes = this.registro.estudiantes;
  readonly idEditar = this.route.snapshot.paramMap.get('id');
  cursosReiniciados = false;
  mensajeError = '';
  readonly formulario = this.fb.nonNullable.group({
    estudianteId: ['', Validators.required],
    periodoId: [this.catalogo.periodos.find((p) => p.activo)?.id ?? '', Validators.required],
    jornada: [this.catalogo.jornadas[0] ?? '', Validators.required],
    modalidad: [this.catalogo.modalidades[0] ?? '', Validators.required],
    cursoIds: this.fb.nonNullable.control<string[]>([], Validators.required),
    estado: ['Registrada' as Inscripcion['estado'], Validators.required],
  });

  constructor() {
    if (this.idEditar) {
      const item = this.registro.inscripciones().find((i) => i.id === this.idEditar);
      if (item) this.formulario.patchValue(item);
    }
    this.aplicarCursosDisponibles(this.formulario.controls.estudianteId.value);
  }

  get cursosDisponibles(): Curso[] {
    return this.cursosParaEstudiante(this.formulario.controls.estudianteId.value);
  }

  cambiarEstudiante(estudianteId: string): void {
    this.formulario.controls.estudianteId.setValue(estudianteId);
    this.aplicarCursosDisponibles(estudianteId);
  }

  private cursosParaEstudiante(estudianteId: string): Curso[] {
    const estudiante = this.estudiantes().find((item) => item.id === estudianteId);
    const carreraId = this.catalogo.carreras.find(
      (carrera) => carrera.nombre === estudiante?.carrera,
    )?.id;
    return this.catalogo.cursos.filter((curso) => curso.carreraId === carreraId);
  }

  private aplicarCursosDisponibles(estudianteId: string): void {
    const disponibles = new Set(this.cursosParaEstudiante(estudianteId).map((curso) => curso.id));
    const seleccionados = this.formulario.controls.cursoIds.value;
    const compatibles = seleccionados.filter((id) => disponibles.has(id));
    this.cursosReiniciados = compatibles.length !== seleccionados.length;
    if (this.cursosReiniciados) {
      this.formulario.controls.cursoIds.setValue(compatibles);
    }
  }

  alternarCurso(id: string, marcado: boolean): void {
    const seleccionados = this.formulario.controls.cursoIds.value;
    this.formulario.controls.cursoIds.setValue(
      marcado ? [...new Set([...seleccionados, id])] : seleccionados.filter((x) => x !== id),
    );
    this.formulario.controls.cursoIds.markAsTouched();
  }

  guardar(): void {
    this.mensajeError = '';
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    if (!this.registro.estudiantes().some((e) => e.id === valor.estudianteId)) {
      this.mensajeError = 'Selecciona un estudiante válido.';
      return;
    }
    if (
      !this.catalogo.periodos.some((periodo) => periodo.id === valor.periodoId) ||
      !this.catalogo.jornadas.includes(valor.jornada) ||
      !this.catalogo.modalidades.includes(valor.modalidad) ||
      !this.catalogo.estados.includes(valor.estado)
    ) {
      this.mensajeError =
        'Selecciona un período, jornada, modalidad y estado válidos del catálogo.';
      return;
    }
    const cursosPermitidos = new Set(this.cursosDisponibles.map((curso) => curso.id));
    if (valor.cursoIds.some((id) => !cursosPermitidos.has(id))) {
      this.mensajeError =
        'Todos los cursos deben pertenecer a la carrera del estudiante seleccionado.';
      return;
    }
    const item: Inscripcion = {
      ...valor,
      id: this.idEditar ?? `INS-${crypto.randomUUID()}`,
      fecha:
        this.registro.inscripciones().find((i) => i.id === this.idEditar)?.fecha ??
        new Date().toISOString(),
    };
    this.registro.guardarInscripcion(item);
    this.router.navigate(['/inscripciones']);
  }
}
