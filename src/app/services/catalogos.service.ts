import { Injectable } from '@angular/core';
import catalogosData from '../data/catalogos.json';
import { Catalogos } from '../models/academic.models';

@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly datos = catalogosData as Catalogos;

  obtener(): Catalogos {
    return this.datos;
  }
}
