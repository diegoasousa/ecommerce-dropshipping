import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('AuthGuard: Verificando autenticação...'); // Debug
  console.log('AuthGuard: isLoggedIn =', authService.isLoggedIn()); // Debug

  if (authService.isLoggedIn()) {
    console.log('AuthGuard: Usuário autenticado, permitindo acesso'); // Debug
    return true;
  }

  console.log('AuthGuard: Usuário não autenticado, redirecionando para home'); // Debug
  alert('Você precisa estar logado para acessar esta página. Por favor, faça login primeiro.');
  
  // Redireciona para home se não estiver logado
  router.navigate(['/']);
  return false;
};