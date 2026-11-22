import { Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiretorioService } from '../../core/services/diretorio.service';
import { LocaisService } from '../../core/services/locais.service';
import { UiService } from '../../core/services/ui.service';
import { LocalCard } from '../../shared/local-card';

@Component({
  selector: 'app-home',
  imports: [FormsModule, LocalCard],
  templateUrl: './home.html',
})
export class Home {
  protected readonly ui = inject(UiService);
  protected readonly dir = inject(DiretorioService);
  protected readonly locais = inject(LocaisService);

  private readonly secao = viewChild<ElementRef<HTMLElement>>('secaoServicos');

  protected readonly categorias = [
    { valor: 'Alimentação', nome: 'Alimentação', sub: 'Comida & bebidas', icone: 'fa-hamburger' },
    { valor: 'Serviços', nome: 'Serviços', sub: 'Profissionais & reparos', icone: 'fa-tools' },
    { valor: 'Pet Shop', nome: 'Pets', sub: 'Cuidados & produtos', icone: 'fa-paw' },
    { valor: 'Saúde', nome: 'Saúde', sub: 'Clínicas & profissionais', icone: 'fa-pills' },
    { valor: '', nome: 'Todos', sub: 'Ver tudo', icone: 'fa-border-all' },
  ];

  protected readonly paginas = computed(() =>
    Array.from({ length: this.dir.totalPaginas() }, (_, i) => i + 1),
  );

  protected irParaPagina(p: number) {
    this.dir.irParaPagina(p);
    this.secao()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
