import { Component, inject } from '@angular/core';
import { UiService } from '../core/services/ui.service';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-escolha-anuncio',
  imports: [Modal],
  template: `
    <app-modal largura="440px">
      <div style="font-size:30px;color:var(--primary);margin-bottom:8px;"><i class="fas fa-book-open"></i></div>
      <h2 style="font-size:20px;">Coloque um negócio na Folha</h2>
      <p class="modal-lead">O cadastro básico é gratuito. Você pode cadastrar seu próprio negócio ou ajudar outra pessoa a ser encontrada.</p>
      <div class="choice-grid">
        <button class="choice-card" type="button" (click)="ui.abrirCadastro()">
          <i class="fas fa-plus-circle"></i>
          <strong>Adicionar gratuitamente</strong>
          <span>Cadastre uma padaria, loja, profissional, serviço ou outro negócio local.</span>
        </button>
      </div>
      <div class="mini-label" style="margin-top:13px;">
        <i class="fas fa-shield-halved"></i> Novos cadastros passam por revisão antes de aparecer publicamente.
      </div>
    </app-modal>
  `,
})
export class ModalEscolhaAnuncio {
  protected readonly ui = inject(UiService);
}
