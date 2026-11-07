import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RegistroService } from '../../services/registro.service';
import { CatalogosService } from '../../services/catalogos.service';

@Component({
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './inicio.html'
})
export class Inicio {
  private readonly registro = inject(RegistroService);
  private readonly catalogos = inject(CatalogosService);
  readonly estudiantes = this.registro.estudiantes;
  readonly inscripciones = this.registro.inscripciones;
  readonly cursos = this.catalogos.obtener().cursos;
  readonly periodos = this.catalogos.obtener().periodos;
}
