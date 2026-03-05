import { Routes } from '@angular/router';
import { AdminInvitesPage } from './admin-invites/admin-invites.page';
import { authGuard } from './core/guards/auth.guard';
import { LoginPage } from './features/auth/login.page';
import { RegisterPage } from './features/auth/register.page';
import { BoardPage } from './features/board/board.page';
import { AppShellPage } from './features/shell/app-shell.page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'register',
    component: RegisterPage,
  },
  {
    path: 'app',
    component: AppShellPage,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'board',
      },
      {
        path: 'board',
        component: BoardPage,
      },
      {
        path: 'admin/invites',
        component: AdminInvitesPage,
      },
    ],
  },
  {
    path: 'admin/invites',
    component: AdminInvitesPage,
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
