import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AuthStore } from '../../features/auth/auth.store';
import { SKIP_AUTH } from '../http/http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const accessToken = authStore.accessToken();
  const request = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || request.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      return from(authStore.refreshAccessToken()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            authStore.logout();
            return throwError(() => error);
          }

          const nextToken = authStore.accessToken();
          if (!nextToken) {
            authStore.logout();
            return throwError(() => error);
          }

          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${nextToken}`,
            },
          });

          return next(retryRequest);
        }),
        catchError((refreshError) => {
          authStore.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
