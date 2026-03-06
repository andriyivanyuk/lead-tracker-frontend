import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../../features/auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.ensureSessionRestored().then((isAuthenticated) => {
    if (isAuthenticated) {
      return true;
    }

    return router.createUrlTree(['/login']);
  });
};
