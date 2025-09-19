import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado';

      if (error.error instanceof ErrorEvent) {
        // Erro do lado do cliente
        errorMessage = `Erro: ${error.error.message}`;
      } else {
        // Erro do lado do servidor
        switch (error.status) {
          case 401:
            errorMessage = 'Não autorizado. Faça login novamente.';
            authService.logout();
            router.navigate(['/']);
            break;
          case 403:
            errorMessage = 'Acesso negado.';
            break;
          case 404:
            errorMessage = 'Recurso não encontrado.';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor.';
            break;
          default:
            errorMessage = error.error?.message || `Erro: ${error.status}`;
        }
      }

      console.error('HTTP Error:', errorMessage, error);
      
      // Você pode implementar um serviço de notificação aqui
      // this.notificationService.showError(errorMessage);

      return throwError(() => new Error(errorMessage));
    })
  );
};