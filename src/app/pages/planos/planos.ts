import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';

/** Formata em reais: R$ 29,90 */
const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

@Component({
  selector: 'app-planos',
  templateUrl: './planos.html',
  styleUrl: './planos.css',
})
export class Planos {
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);

  /**
   * AJUSTE AQUI preços e disponibilidade: a página inteira lê estes valores.
   *  - disponivel: false  -> o botão fica desabilitado, com "Em implantação".
   *  - Os recursos marcados como "em breve" no HTML ainda não existem no site.
   */
  protected readonly config = {
    pro: { mensal: 29.9, anual: 299, fundador: 19.9, vagasFundador: 50, disponivel: true },
    selo: { anual: 59.9, disponivel: false },
  };

  protected readonly brl = brl;

  protected comecarGratis() {
    this.ui.abrirCadastro();
  }

  /** Pro e selo partem do painel do profissional (login primeiro). */
  protected irParaPainel() {
    this.ui.abrir(this.auth.user() ? 'painel' : 'acesso');
  }
}
