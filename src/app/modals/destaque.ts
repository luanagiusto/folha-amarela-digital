import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { SolicitacoesService } from '../core/services/solicitacoes.service';
import { UiService } from '../core/services/ui.service';
import { limparWhatsApp } from '../core/utils/texto';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-destaque',
  imports: [Modal, FormsModule, RouterLink],
  template: `
    <app-modal largura="460px">
      <div style="font-size:28px;color:var(--primary);margin-bottom:8px;"><i class="fas fa-star"></i></div>
      <h2>Colocar negócio em destaque</h2>
      <p class="modal-lead">
        O perfil gratuito continua aparecendo normalmente. O destaque é uma opção paga para dar mais visibilidade ao negócio.
        Veja os nossos <a routerLink="/planos" style="color: var(--primary);" (click)="ui.fechar()">Planos para Negócios</a>.
      </p>
      <div class="claim-box">
        <strong>{{ local.nome || 'Negócio' }}</strong>
        <span>Quando a modalidade estiver ativa, o destaque poderá aparecer em uma área identificada como patrocinada.</span>
      </div>
      <div class="form-group" style="margin-top:16px;"><label>E-mail para contato</label>
        <input type="email" class="form-control" placeholder="seu@email.com" autocomplete="email" [(ngModel)]="email"></div>
      <div class="form-group"><label>WhatsApp para contato</label>
        <input type="tel" class="form-control" inputmode="numeric" placeholder="35999999999" [(ngModel)]="whatsapp"></div>
      <button class="btn-submit" [disabled]="enviado()" (click)="enviar()">
        <i class="fas fa-paper-plane"></i> Quero receber informações
      </button>
      <div class="helper-text" style="min-height:18px;">{{ mensagem() }}</div>
    </app-modal>
  `,
})
export class ModalDestaque {
  protected readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  private readonly solicitacoes = inject(SolicitacoesService);

  protected readonly local = this.ui.localAtual()!;
  protected email = this.auth.user()?.email ?? '';
  protected whatsapp = '';
  protected readonly mensagem = signal('');
  protected readonly enviado = signal(false);

  protected async enviar() {
    if (!this.email.trim() && !limparWhatsApp(this.whatsapp)) {
      return this.mensagem.set('Informe pelo menos um e-mail ou WhatsApp.');
    }
    this.mensagem.set('Enviando...');
    try {
      await this.solicitacoes.enviarInteresseDestaque({
        localId: this.local.idDoc,
        nomeLocal: this.local.nome ?? '',
        email: this.email.trim(),
        whatsapp: this.whatsapp,
        userId: this.auth.user()?.uid ?? '',
      });
      this.enviado.set(true);
      this.mensagem.set('Recebemos seu interesse!');
    } catch (e) {
      console.error(e);
      this.mensagem.set('Erro ao enviar. Tente novamente em instantes.');
    }
  }
}
