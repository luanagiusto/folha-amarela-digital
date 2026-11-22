import { Component, inject } from '@angular/core';
import { UiService } from '../core/services/ui.service';
import { ModalAcesso } from './acesso';
import { ModalCadastro } from './cadastro';
import { ModalChat } from './chat';
import { ModalCidade } from './cidade';
import { ModalDestaque } from './destaque';
import { ModalDetalhesLocal } from './detalhes-local';
import { ModalEditarPerfil } from './editar-perfil';
import { ModalEscolhaAnuncio } from './escolha-anuncio';
import { ModalIndicacao } from './indicacao';
import { ModalPainel } from './painel';

/** Mostra o modal indicado em UiService.modal (um por vez). */
@Component({
  selector: 'app-modais-host',
  imports: [
    ModalAcesso, ModalCadastro, ModalChat, ModalCidade, ModalDestaque,
    ModalDetalhesLocal, ModalEditarPerfil, ModalEscolhaAnuncio, ModalIndicacao, ModalPainel,
  ],
  template: `
    @switch (ui.modal()) {
      @case ('escolhaAnuncio') { <app-modal-escolha-anuncio /> }
      @case ('cadastro') { <app-modal-cadastro /> }
      @case ('cidade') { <app-modal-cidade /> }
      @case ('acesso') { <app-modal-acesso /> }
      @case ('painel') { <app-modal-painel /> }
      @case ('editarPerfil') { <app-modal-editar-perfil /> }
      @case ('detalhes') { <app-modal-detalhes-local /> }
      @case ('destaque') { <app-modal-destaque /> }
      @case ('indicacao') { <app-modal-indicacao /> }
      @case ('chat') { <app-modal-chat /> }
    }
  `,
})
export class ModaisHost {
  protected readonly ui = inject(UiService);
}
