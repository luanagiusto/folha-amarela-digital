import { ChangeDetectorRef, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS, LocalForm } from '../core/models/models';
import { ExternoService } from '../core/services/externo.service';
import { limparWhatsApp, mascaraCep } from '../core/utils/texto';

/**
 * Formulário único de negócio, usado no cadastro e na edição.
 * (No site atual eram dois formulários com IDs duplicados/faltando.)
 */
@Component({
  selector: 'app-local-form',
  imports: [FormsModule],
  template: `
    <div class="form-group">
      <label>Nome do estabelecimento ou profissional</label>
      <input class="form-control" name="nome" [(ngModel)]="f.nome" placeholder="Ex: Padaria do Zé ou João Eletricista">
    </div>

    <div class="form-group">
      <label>Categoria</label>
      <select class="form-control" name="categoria" [(ngModel)]="f.categoria">
        @for (c of categorias; track c) { <option [value]="c">{{ c }}</option> }
      </select>
    </div>

    <div class="form-group">
      <label>O que faz?</label>
      <input class="form-control" name="descricao" [(ngModel)]="f.descricao"
             placeholder="Ex: pães, bolos e salgados / instalação elétrica">
      <div class="helper-text">Use palavras que um morador realmente procuraria.</div>
    </div>

    <div class="form-group">
      <label>Palavras-chave</label>
      <input class="form-control" name="keywords" [(ngModel)]="f.keywords" placeholder="padaria, pão, bolo, café">
      <div class="helper-text">Separe por vírgulas. Elas ajudam a encontrar o negócio mesmo sem saber o nome.</div>
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:1;">
        <label>CEP</label>
        <input class="form-control" name="cep" [ngModel]="f.cep" (ngModelChange)="aoDigitarCep($event)"
               (blur)="buscarCep()" placeholder="00000-000" maxlength="9" inputmode="numeric">
      </div>
      <div class="form-group" style="flex:2;">
        <label>Rua e Número</label>
        <input class="form-control" name="endereco" [(ngModel)]="f.endereco" placeholder="Ex: Rua Direita, 123">
      </div>
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:1;">
        <label>Bairro</label>
        <input class="form-control" name="bairro" [(ngModel)]="f.bairro" placeholder="Centro">
      </div>
      <div class="form-group" style="flex:1;">
        <label>Cidade</label>
        <input class="form-control" name="cidade" [(ngModel)]="f.cidade" placeholder="Paraisópolis">
      </div>
    </div>

    <div class="form-group">
      <label>Horário de Atendimento</label>
      <input class="form-control" name="horario" [(ngModel)]="f.horario" placeholder="Ex: Seg-Sex, 08h-18h">
    </div>

    <div class="form-row">
      <div class="form-group" style="flex:1;">
        <label>WhatsApp</label>
        <input class="form-control" name="whatsapp" [(ngModel)]="f.whatsapp" inputmode="numeric" placeholder="35999999999">
      </div>
      <div class="form-group" style="flex:1;">
        <label>Outro telefone</label>
        <input class="form-control" name="telefoneExtra" [(ngModel)]="f.telefoneExtra" inputmode="tel">
      </div>
    </div>

    <div class="form-group">
      <label>Instagram (opcional)</label>
      <input class="form-control" name="instagram" [(ngModel)]="f.instagram" placeholder="Ex: @padariadoze">
    </div>

    <div class="helper-text" style="min-height:18px">{{ erro() || mensagem() }}</div>
    <button class="btn-submit" type="button" [disabled]="ocupado()" (click)="enviarForm()">
      <i class="fas fa-paper-plane"></i> {{ rotulo() }}
    </button>
  `,
})
export class LocalFormComponent implements OnInit {
  private readonly externo = inject(ExternoService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly inicial = input.required<LocalForm>();
  readonly rotulo = input('Salvar');
  readonly mensagem = input('');
  readonly ocupado = input(false);
  readonly enviar = output<LocalForm>();

  protected readonly categorias = CATEGORIAS;
  protected readonly erro = signal('');
  protected f!: LocalForm;

  ngOnInit() {
    this.f = { ...this.inicial() };
  }

  protected aoDigitarCep(v: string) {
    this.f.cep = mascaraCep(v);
  }

  protected async buscarCep() {
    if (this.f.cep.replace(/\D/g, '').length !== 8) return;
    try {
      const e = await this.externo.buscarCep(this.f.cep);
      if (e) {
        if (e.logradouro) this.f.endereco = e.logradouro + ', ';
        if (e.bairro) this.f.bairro = e.bairro;
        if (e.localidade) this.f.cidade = e.localidade;
      } else {
        this.erro.set('CEP não encontrado. Pode preencher os dados manualmente.');
      }
    } catch {
      /* sem rede: o usuário preenche manualmente */
    }
    this.cdr.markForCheck();
  }

  protected enviarForm() {
    const wpp = limparWhatsApp(this.f.whatsapp);
    if (!this.f.nome.trim() || !this.f.descricao.trim()) {
      this.erro.set('Informe o nome e o que o negócio faz.');
      return;
    }
    if (wpp && (wpp.length < 10 || wpp.length > 13)) {
      this.erro.set('Confira o número de WhatsApp.');
      return;
    }
    this.erro.set('');
    this.enviar.emit({ ...this.f });
  }
}
