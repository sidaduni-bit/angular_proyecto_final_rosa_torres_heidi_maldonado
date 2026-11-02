import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RegistroService } from '../../services/registro.service';
import { CatalogosService } from '../../services/catalogos.service';

@Component({
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './inscripciones.html'
})
export class Inscripciones {
  private readonly registro = inject(RegistroService);
  private readonly catalogos = inject(CatalogosService);
  readonly filtro = signal('');
  readonly busquedaEstudiante = signal('');
  readonly catalogo = this.catalogos.obtener();
  readonly lista = computed(() => {
    const filtro = this.filtro();
    const texto = this.busquedaEstudiante().trim().toLowerCase();

    return this.registro.inscripciones().filter(item => {
      const coincideFiltro = filtro === '' || item.estado === filtro || item.periodoId === filtro;
      if (!coincideFiltro || !texto) return coincideFiltro;

      const estudiante = this.registro.estudiantes().find(
        registro => registro.id === item.estudianteId
      );
      const datosEstudiante = estudiante
        ? `${estudiante.codigo} ${estudiante.nombres} ${estudiante.apellidos}`.toLowerCase()
        : '';

      return datosEstudiante.includes(texto);
    });
  });
  nombreEstudiante(id: string): string {
    const estudiante = this.registro.estudiantes().find(item => item.id === id);
    return estudiante ? `${estudiante.nombres} ${estudiante.apellidos}` : 'Estudiante no encontrado';
  }
  nombreCursos(ids: string[]): string {
    return ids.map(id => this.catalogo.cursos.find(c => c.id === id)?.nombre ?? id).join(', ');
  }
  cancelar(id: string): void {
    if (!confirm('¿Deseas cancelar esta inscripción?')) return;
    const item = this.registro.inscripciones().find(i => i.id === id);
    if (item) this.registro.guardarInscripcion({ ...item, estado: 'Cancelada' });
  }
}
