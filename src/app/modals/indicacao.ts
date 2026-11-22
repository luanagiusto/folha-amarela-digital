import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { DiretorioService } from '../core/services/diretorio.service';
import { SolicitacoesService } from '../core/services/solicitacoes.service';
import { UiService } from '../core/services/ui.service';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-indicacao',
  imports: [Modal, FormsModule],
  template: `
    <app-modal>
      <h2><i class="fas fa-user-plus" style="color:var(--primary);"></i> Indicar alguém</h2>
      <p style="color:var(--gray);font-size:13px;line-height:1.5;margin-bottom:18px;">
        Conhece alguém que faz o que você procurou? Indique. A pessoa pode ser autônoma, trabalhar de casa ou simplesmente ainda não ter divulgado o serviço.
      </p>
      <div class="form-group"><label>Nome da pessoa ou negócio</label>
        <input type="text" class="form-control" placeholder="Ex: Maria da Costura" [(ngModel)]="nome"></div>
      <div class="form-group"><label>O que ela faz?</label>
        <input type="text" class="form-control" placeholder="Ex: costura e ajustes de roupas" [(ngModel)]="servico"></div>
      <div class="form-row">
        <div class="form-group" style="flex:1;"><label>Cidade</label>
          <input type="text" class="form-control" [(ngModel)]="cidade"></div>
        <div class="form-group" style="flex:1;"><label>Bairro (opcional)</label>
          <input type="text" class="form-control" placeholder="Centro" [(ngModel)]="bairro"></div>
      </div>
      <div class="form-group"><label>WhatsApp (opcional)</label>
        <input type="tel" class="form-control" inputmode="numeric" placeholder="35999999999" [(ngModel)]="whatsapp"></div>
      <div class="helper-text" style="min-height:18px;">{{ mensagem() }}</div>
      <button class="btn-submit" [disabled]="ocupado()" (click)="enviar()">
        <i class="fas fa-paper-plane"></i> Enviar indicação
      </button>
    </app-modal>
  `,
})
export class ModalIndicacao {
  private readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  private readonly solicitacoes = inject(SolicitacoesService);

  protected nome = '';
  protected servico = this.ui.indicacaoTermo();
  protected cidade = inject(DiretorioService).cidade();
  protected bairro = '';
  protected whatsapp = '';
  protected readonly mensagem = signal('');
  protected readonly ocupado = signal(false);

  protected async enviar() {
    if (!this.nome.trim() || !this.servico.trim()) return this.mensagem.set('Informe nome e serviço.');
    this.ocupado.set(true);
    try {
      await this.solicitacoes.enviarIndicacao({
        nome: this.nome.trim(),
        servico: this.servico.trim(),
        cidade: this.cidade.trim(),
        bairro: this.bairro.trim(),
        whatsapp: this.whatsapp,
        userId: this.auth.user()?.uid ?? '',
      });
      this.ui.fechar();
      alert('Indicação enviada!');
    } catch (e) {
      console.error(e);
      this.mensagem.set('Erro ao enviar.');
      this.ocupado.set(false);
    }
  }
}
