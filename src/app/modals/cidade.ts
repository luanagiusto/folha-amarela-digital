import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiretorioService } from '../core/services/diretorio.service';
import { ExternoService } from '../core/services/externo.service';
import { UiService } from '../core/services/ui.service';
import { normalizarTexto } from '../core/utils/texto';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-cidade',
  imports: [Modal, FormsModule],
  template: `
    <app-modal largura="420px">
      <div style="text-align:center; padding: 8px 0;">
        <div style="width:56px;height:56px;background:rgba(245,158,11,0.15);color:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <h2 style="font-size:22px;font-weight:800;color:var(--dark);">Onde você está?</h2>
        <p style="font-size:14px;color:var(--gray);margin-top:8px;">Digite a cidade ou use a sua localização atual para ver os comércios próximos.</p>
      </div>

      <div class="form-group" style="text-align:left;position:relative;">
        <i class="fas fa-search" style="position:absolute;left:16px;top:16px;color:var(--gray);"></i>
        <input type="text" class="form-control" placeholder="Ex: Itajubá, MG" list="listaCidades"
               style="padding-left:44px;height:48px;margin-bottom:12px;"
               [(ngModel)]="texto" (keydown.enter)="confirmar()">
        <datalist id="listaCidades">
          @for (c of diretorio.cidades(); track c) { <option [value]="c"></option> }
        </datalist>
        <button class="btn-submit" style="height:48px;" (click)="confirmar()">Confirmar Cidade</button>
      </div>

      <div style="display:flex;align-items:center;margin:24px 0;color:var(--gray);font-size:12px;font-weight:700;">
        <hr style="flex:1;border:none;border-top:1px solid var(--border);">
        <span style="padding:0 12px;text-transform:uppercase;letter-spacing:1px;">ou</span>
        <hr style="flex:1;border:none;border-top:1px solid var(--border);">
      </div>

      <button class="btn-card btn-outline" [disabled]="buscandoGps()"
              style="width:100%;height:48px;border-radius:12px;font-weight:700;color:var(--dark);display:flex;justify-content:center;align-items:center;"
              (click)="usarGps()">
        @if (buscandoGps()) {
          <i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Procurando...
        } @else {
          <i class="fas fa-location-arrow" style="margin-right:8px;color:var(--primary);"></i> Usar minha localização (GPS)
        }
      </button>
    </app-modal>
  `,
})
export class ModalCidade {
  protected readonly diretorio = inject(DiretorioService);
  private readonly ui = inject(UiService);
  private readonly externo = inject(ExternoService);

  protected texto = '';
  protected readonly buscandoGps = signal(false);

  private aplicar(c: string) {
    this.diretorio.mudarCidade(c);
    this.ui.fechar();
  }

  protected confirmar() {
    const c = this.texto.trim();
    if (!c) return alert('Por favor, digite o nome da cidade.');
    this.aplicar(c);
  }

  protected async usarGps() {
    if (!navigator.geolocation) return alert('O seu navegador não disponibiliza localização.');
    this.buscandoGps.set(true);
    try {
      const encontrada = await this.externo.cidadePorGps();
      if (!encontrada) return alert('Não foi possível identificar a cidade através destas coordenadas.');
      const existente = this.diretorio.cidades().find((c) => normalizarTexto(c) === normalizarTexto(encontrada));
      if (existente) {
        this.aplicar(existente);
      } else {
        this.aplicar(encontrada);
        alert(`Localização encontrada: ${encontrada}. Ainda pode não haver locais registados aqui.`);
      }
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      if (code === 1) alert('Permissão de GPS negada. Autorize o acesso à localização nas definições do navegador.');
      else if (code === 2) alert('Sinal de GPS indisponível neste momento.');
      else if (code === 3) alert('Tempo limite excedido ao tentar obter a localização.');
      else { console.error(e); alert('Erro ao consultar o serviço de mapas.'); }
    } finally {
      this.buscandoGps.set(false);
    }
  }
}
