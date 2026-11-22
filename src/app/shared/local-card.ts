import { Component, computed, inject, input } from '@angular/core';
import { Local } from '../core/models/models';
import { DiretorioService } from '../core/services/diretorio.service';
import { UiService } from '../core/services/ui.service';
import {
  abrirWhatsApp, descricaoCurtaLocal, mensagemWhatsApp, nomeExibicaoLocal, registroDestaque,
} from '../core/utils/texto';

@Component({
  selector: 'app-local-card',
  template: `
    <article class="card-local" [class.is-featured]="destaque()">
      <div class="card-body">
        @if (destaque()) { <div class="featured-badge">★ Patrocinado</div> }

        <div class="card-topline"><div class="card-title">{{ nome() }}</div></div>

        <div class="card-subtitle">
          <span><i class="fas fa-tag"></i> {{ local().categoria || 'Serviço' }}</span>
          <span><i class="fas fa-location-dot"></i> {{ local().bairro || 'Centro' }}</span>
        </div>

        @if (local().descricao || local().servicos) {
          <p class="card-description">{{ descricaoCurta() }}</p>
        }
        @if (local().keywords || local().palavrasChave) {
          <div class="card-keywords">Encontre por: {{ local().keywords || local().palavrasChave }}</div>
        }

        <div class="card-actions">
          @if (local().whatsapp || local().telefone) {
            <button type="button" class="btn-card btn-wpp" (click)="whatsapp()">
              <i class="fab fa-whatsapp"></i> WhatsApp
            </button>
          }
          <button type="button" class="btn-card btn-outline" (click)="ui.abrirDetalhes(local())">Detalhes</button>
        </div>
      </div>
    </article>
  `,
})
export class LocalCard {
  protected readonly ui = inject(UiService);
  private readonly diretorio = inject(DiretorioService);

  readonly local = input.required<Local>();

  protected readonly nome = computed(() => nomeExibicaoLocal(this.local()));
  protected readonly destaque = computed(() => registroDestaque(this.local()));
  protected readonly descricaoCurta = computed(() => descricaoCurtaLocal(this.local()));

  protected whatsapp() {
    const l = this.local();
    abrirWhatsApp(l.whatsapp || l.telefone, mensagemWhatsApp(l, this.diretorio.cidade()));
  }
}
