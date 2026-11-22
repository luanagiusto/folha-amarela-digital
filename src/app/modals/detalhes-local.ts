import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DiretorioService } from '../core/services/diretorio.service';
import { UiService } from '../core/services/ui.service';
import {
  abrirWhatsApp, linkInstagram, linkMapa, mensagemWhatsApp, nomeExibicaoLocal, registroDestaque,
} from '../core/utils/texto';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-detalhes-local',
  imports: [Modal],
  template: `
    <app-modal largura="480px">
      @if (destaque) { <div class="featured-badge">★ Em destaque</div> }
      <h2 style="font-size:22px;margin-bottom:12px;padding-right:30px;line-height:1.25;color:var(--dark);">{{ nome }}</h2>

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <span class="status-badge" style="background:var(--purple);color:white;">
          <i class="fas fa-tag"></i> {{ l.categoria || 'Serviço' }}
        </span>
      </div>

      <button class="btn-card btn-outline" style="width:100%;display:flex;justify-content:center;border-radius:12px;font-weight:700;margin-bottom:12px;"
              (click)="verPerfil()"><i class="fas fa-id-card"></i> Perfil completo</button>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px;">
        @if (l.endereco) {
          <div style="color:var(--gray);font-size:14px;display:flex;align-items:flex-start;gap:8px;">
            <i class="fas fa-map-marker-alt" style="color:var(--primary);width:16px;text-align:center;margin-top:3px;"></i>
            <span style="flex:1;line-height:1.4;">{{ l.endereco }} - {{ l.bairro || 'Centro' }}, {{ l.cidade || cidade }}</span>
          </div>
        } @else {
          <div style="color:var(--gray);font-size:14px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-location-dot" style="color:var(--primary);width:16px;text-align:center;"></i>
            <span>{{ l.bairro || 'Centro' }}, {{ l.cidade || cidade }}</span>
          </div>
        }
        @if (l.horario) {
          <div style="color:var(--gray);font-size:14px;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-clock" style="color:var(--primary);width:16px;text-align:center;"></i>
            <span>{{ l.horario }}</span>
          </div>
        }
      </div>

      <p class="card-description detail-description" style="font-size:14px;color:var(--dark);line-height:1.6;margin-bottom:20px;">
        {{ l.descricao || l.servicos || 'Este perfil ainda não possui uma descrição detalhada.' }}
      </p>
      @if (l.keywords || l.palavrasChave) {
        <div class="card-keywords">Encontre por: {{ l.keywords || l.palavrasChave }}</div>
      }

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;border-top:1px solid var(--border);padding-top:20px;">
        @if (l.whatsapp || l.telefone) {
          <button class="btn-card btn-wpp" style="width:100%;border:none;display:flex;justify-content:center;border-radius:12px;font-weight:700;"
                  (click)="whatsapp()"><i class="fab fa-whatsapp"></i> WhatsApp</button>
        }
        @if (l.telefoneExtra) {
          <a class="btn-card" [href]="'tel:' + l.telefoneExtra"
             style="text-decoration:none;width:100%;background:var(--input-bg);color:var(--dark);border:1px solid var(--border);display:flex;justify-content:center;border-radius:12px;font-weight:700;">
            <i class="fas fa-phone"></i> Ligar</a>
        }
        @if (l.instagram) {
          <a class="btn-card" [href]="instagram" target="_blank" rel="noopener noreferrer"
             style="text-decoration:none;width:100%;background:linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);color:white;border:none;display:flex;justify-content:center;border-radius:12px;font-weight:700;">
            <i class="fab fa-instagram"></i> Instagram</a>
        }
        @if (l.endereco || l.bairro) {
          <a class="btn-card" [href]="mapa" target="_blank" rel="noopener noreferrer"
             style="text-decoration:none;width:100%;background:#4285F4;color:white;border:none;display:flex;justify-content:center;border-radius:12px;font-weight:700;">
            <i class="fas fa-map-location-dot"></i> Como chegar</a>
        }
      </div>
    </app-modal>
  `,
})
export class ModalDetalhesLocal {
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);
  protected readonly cidade = inject(DiretorioService).cidade();

  protected readonly l = this.ui.localAtual()!;
  protected readonly nome = nomeExibicaoLocal(this.l);
  protected readonly destaque = registroDestaque(this.l);
  protected readonly instagram = this.l.instagram ? linkInstagram(this.l.instagram) : '';
  protected readonly mapa = linkMapa(this.l, this.cidade);

  protected whatsapp() {
    abrirWhatsApp(this.l.whatsapp || this.l.telefone, mensagemWhatsApp(this.l, this.cidade));
  }

  protected verPerfil() {
    this.ui.fechar();
    this.router.navigate(['/perfil', this.l.idDoc]);
  }
}
