import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RegistroService } from '../../services/registro.service';
import { CatalogosService } from '../../services/catalogos.service';
import { Estudiante } from '../../models/academic.models';

const TELEFONO_VALIDO = /^(?=(?:\D*\d){8}\D*$)[0-9+() -]{8,20}$/;

function fechaLocalActual(): string {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function textoRecortado(minimo: number, maximo: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (typeof control.value !== 'string') return { required: true };

    const longitud = control.value.trim().length;
    if (longitud === 0) return { required: true };
    if (longitud < minimo) {
      return { minlength: { requiredLength: minimo, actualLength: longitud } };
    }
    if (longitud > maximo) {
      return { maxlength: { requiredLength: maximo, actualLength: longitud } };
    }
    return null;
  };
}

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './estudiante-form.html',
})
export class EstudianteForm {
  private readonly fb = inject(FormBuilder);
  private readonly registro = inject(RegistroService);
  private readonly catalogos = inject(CatalogosService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly catalogo = this.catalogos.obtener();
  readonly idEditar = this.route.snapshot.paramMap.get('id');
  readonly editando = !!this.idEditar;
  readonly fechaMaxima = fechaLocalActual();

  readonly formulario = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^EST-[0-9]{3,}$/)]],
    nombres: ['', textoRecortado(2, 60)],
    apellidos: ['', textoRecortado(2, 60)],
    fechaNacimiento: [
      '',
      [
        Validators.required,
        (control: AbstractControl) =>
          control.value && control.value > this.fechaMaxima ? { fechaFutura: true } : null,
      ],
    ],
    genero: ['Prefiero no indicar', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    direccion: ['', textoRecortado(5, 160)],
    carrera: [this.catalogo.carreras[0]?.nombre ?? '', Validators.required],
    contactos: this.fb.array([this.crearContacto()]),
  });

  constructor() {
    if (this.idEditar) {
      const estudiante = this.registro.estudiantes().find((item) => item.id === this.idEditar);
      if (estudiante) {
        this.formulario.patchValue(estudiante);
        this.formulario.setControl(
          'contactos',
          this.fb.array(
            estudiante.contactos.map((contacto) =>
              this.fb.nonNullable.group({
                numero: [
                  contacto.numero,
                  [Validators.required, Validators.pattern(TELEFONO_VALIDO)],
                ],
                tipo: [contacto.tipo, Validators.required],
                activo: [contacto.activo],
              }),
            ),
          ),
        );
      }
    }
  }

  get contactos(): FormArray {
    return this.formulario.controls.contactos;
  }

  private crearContacto() {
    return this.fb.nonNullable.group({
      numero: ['', [Validators.required, Validators.pattern(TELEFONO_VALIDO)]],
      tipo: ['Móvil' as 'Móvil' | 'Casa' | 'Trabajo' | 'Otro', Validators.required],
      activo: [true],
    });
  }

  agregarContacto(): void {
    this.contactos.push(this.crearContacto());
  }

  quitarContacto(indice: number): void {
    if (this.contactos.length > 1) this.contactos.removeAt(indice);
  }

  guardar(): void {
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) return;
    const valor = this.formulario.getRawValue();
    const duplicado = this.registro
      .estudiantes()
      .some(
        (item) =>
          item.codigo.toLowerCase() === valor.codigo.toLowerCase() && item.id !== this.idEditar,
      );
    if (duplicado) {
      this.formulario.controls.codigo.setErrors({ duplicado: true });
      return;
    }
    const estudiante: Estudiante = {
      ...valor,
      nombres: valor.nombres.trim(),
      apellidos: valor.apellidos.trim(),
      direccion: valor.direccion.trim(),
      contactos: valor.contactos.map((contacto) => ({
        ...contacto,
        numero: contacto.numero.trim(),
      })),
      id: this.idEditar ?? crypto.randomUUID(),
      fechaRegistro: this.idEditar
        ? (this.registro.estudiantes().find((item) => item.id === this.idEditar)?.fechaRegistro ??
          new Date().toISOString())
        : new Date().toISOString(),
    };
    this.registro.guardarEstudiante(estudiante);
    this.router.navigate(['/estudiantes']);
  }
}
