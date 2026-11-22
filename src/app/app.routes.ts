import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Perfil } from './pages/perfil/perfil';
import { Planos } from './pages/planos/planos';

export const routes: Routes = [
  { path: '', component: Home, title: 'Folha Amarela Digital' },
  { path: 'perfil/:id', component: Perfil },
  { path: 'planos', component: Planos, title: 'Seja Verificado - Folha Amarela Digital' },

  // Links antigos do site em HTML (ex.: compartilhados no WhatsApp) continuam funcionando
  {
    path: 'perfil.html',
    redirectTo: (r) => {
      const id = r.queryParams['id'];
      return id ? `/perfil/${encodeURIComponent(id)}` : '/';
    },
  },
  { path: 'planos.html', redirectTo: 'planos' },
  { path: 'index.html', redirectTo: '' },

  { path: '**', redirectTo: '' },
];
