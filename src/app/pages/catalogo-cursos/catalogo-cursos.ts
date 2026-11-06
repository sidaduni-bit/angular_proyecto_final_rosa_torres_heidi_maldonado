import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CatalogosService } from '../../services/catalogos.service';
import { Curso } from '../../models/academic.models';

@Component({
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './catalogo-cursos.html'
})
export class CatalogoCursos {
  private readonly catalogos = inject(CatalogosService).obtener();
  readonly cursos = this.catalogos.cursos;
  readonly carreras = this.catalogos.carreras;
  readonly cursoSeleccionado = signal<string | null>(null);

  alternarDescripcion(curso: Curso): void {
    this.cursoSeleccionado.update(id => id === curso.id ? null : curso.id);
  }

  nombreCarrera(id: string): string {
    return this.carreras.find(c => c.id === id)?.nombre ?? id;
  }
}
