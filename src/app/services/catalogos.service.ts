import { Injectable } from '@angular/core';
import catalogosData from '../data/catalogos.json';
import periodosData from '../data/periodos.json';
import { Catalogos } from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly datos: Catalogos = {
    ...catalogosData,
    periodos: periodosData
  };

  obtener(): Catalogos {
    return this.datos;
  }
}
