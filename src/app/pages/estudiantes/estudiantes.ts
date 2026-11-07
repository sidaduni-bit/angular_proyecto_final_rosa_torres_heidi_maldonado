import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RegistroService } from '../../services/registro.service';

@Component({
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './estudiantes.html'
})
export class Estudiantes {
  private readonly registro = inject(RegistroService);
  readonly busqueda = signal('');
  readonly lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.registro.estudiantes().filter(e =>
      `${e.codigo} ${e.nombres} ${e.apellidos} ${e.correo}`.toLowerCase().includes(texto));
  });

  eliminar(id: string, nombre: string): void {
    if (!confirm(`¿Deseas eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;
    const eliminado = this.registro.eliminarEstudiante(id);
    if (!eliminado) alert('No se puede eliminar: el estudiante tiene inscripciones activas. Cancela primero sus inscripciones.');
  }
}
