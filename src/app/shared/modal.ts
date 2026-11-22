import { Component, HostListener, inject, input } from '@angular/core';
import { UiService } from '../core/services/ui.service';

/** Casca de modal: fundo escuro, clique fora e ESC fecham (igual ao site atual). */
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal" style="display:block" (click)="aoClicarFundo($event)">
      <div class="modal-content" [style.max-width]="largura()">
        <span class="close" (click)="ui.fechar()">&times;</span>
        <ng-content />
      </div>
    </div>
  `,
})
export class Modal {
  protected readonly ui = inject(UiService);
  readonly largura = input('520px');

  protected aoClicarFundo(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal')) this.ui.fechar();
  }

  @HostListener('document:keydown.escape')
  protected aoEsc() {
    this.ui.fechar();
  }
}
