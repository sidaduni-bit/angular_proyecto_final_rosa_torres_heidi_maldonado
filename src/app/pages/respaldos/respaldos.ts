import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RegistroService } from '../../services/registro.service';

@Component({
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './respaldos.html'
})
export class Respaldos {
  private readonly registro = inject(RegistroService);
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  exportar(): void {
    const respaldo = this.registro.crearRespaldo();
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'umes_respaldo.json';
    enlace.click();
    URL.revokeObjectURL(url);
    this.mostrar('Respaldo exportado correctamente.', 'success');
  }

  async importar(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    try {
      let datos: unknown;
      try {
        datos = JSON.parse(await archivo.text());
      } catch {
        this.mostrar('No fue posible leer el archivo. Verifica que sea un JSON válido. Los datos actuales siguen intactos.', 'error');
        return;
      }
      if (!this.registro.validarRespaldo(datos)) {
        this.mostrar('El archivo contiene campos incompletos, valores no válidos o relaciones académicas inexistentes. No se modificaron los datos.', 'error');
        return;
      }
      const confirmar = confirm(`El respaldo contiene ${datos.estudiantes.length} estudiante(s) y ${datos.inscripciones.length} inscripción(es). Se reemplazarán todos los registros actuales. ¿Deseas continuar?`);
      if (!confirmar) return;
      try {
        this.registro.reemplazarDatos(datos);
      } catch {
        this.mostrar('No fue posible guardar el respaldo en el almacenamiento local. Los registros en pantalla no fueron reemplazados.', 'error');
        return;
      }
      this.mostrar('Datos importados correctamente.', 'success');
    } finally {
      input.value = '';
    }
  }

  private mostrar(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
  }
}
