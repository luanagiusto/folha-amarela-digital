import { Component, inject, signal } from '@angular/core';
import { LocalForm } from '../core/models/models';
import { LocaisService } from '../core/services/locais.service';
import { UiService } from '../core/services/ui.service';
import { LocalFormComponent } from '../shared/local-form';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-editar-perfil',
  imports: [Modal, LocalFormComponent],
  template: `
    <app-modal>
      <h2 style="font-size:20px;"><i class="fas fa-pen" style="color:var(--primary);"></i> Editar perfil</h2>
      <p class="modal-lead">As alterações serão salvas no perfil que você administra.</p>
      <app-local-form [inicial]="inicial" rotulo="Salvar alterações"
                      [mensagem]="mensagem()" [ocupado]="ocupado()" (enviar)="salvar($event)" />
    </app-modal>
  `,
})
export class ModalEditarPerfil {
  private readonly ui = inject(UiService);
  private readonly locais = inject(LocaisService);

  private readonly local = this.ui.localAtual()!;
  protected readonly mensagem = signal('');
  protected readonly ocupado = signal(false);

  protected readonly inicial: LocalForm = {
    nome: this.local.nome ?? '',
    categoria: this.local.categoria ?? 'Serviços',
    descricao: this.local.descricao || this.local.servicos || '',
    keywords: this.local.keywords || this.local.palavrasChave || '',
    cep: this.local.cep ?? '',
    endereco: this.local.endereco ?? '',
    bairro: this.local.bairro || 'Centro',
    cidade: this.local.cidade ?? '',
    horario: this.local.horario ?? '',
    whatsapp: this.local.whatsapp ?? '',
    telefoneExtra: this.local.telefoneExtra ?? '',
    instagram: this.local.instagram ?? '',
  };

  protected async salvar(f: LocalForm) {
    this.ocupado.set(true);
    this.mensagem.set('Salvando...');
    try {
      await this.locais.atualizar(this.local.idDoc, f);
      this.mensagem.set('Perfil atualizado.');
      setTimeout(() => this.ui.fechar(), 500);
    } catch (e) {
      console.error(e);
      this.mensagem.set('Erro ao salvar.');
      this.ocupado.set(false);
    }
  }
}
