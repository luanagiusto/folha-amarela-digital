import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './layout/footer';
import { Header } from './layout/header';
import { NavDrawer } from './layout/nav-drawer';
import { ModaisHost } from './modals/modais-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, NavDrawer, Footer, ModaisHost],
  template: `
    <app-header />
    <app-nav-drawer />
    <router-outlet />
    <app-footer />
    <app-modais-host />
  `,
})
export class App {}
