import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; text-align: center;">
      <p>{{ message }}</p>
      <div *ngIf="error" style="color: red; margin-top: 10px;">
        <p>{{ error }}</p>
        <p>URL atual: {{ currentUrl }}</p>
        <p>Parâmetros: {{ urlParams }}</p>
      </div>
    </div>
  `,
})
export class LoginCallbackComponent implements OnInit {
  message = 'Autenticando...';
  error = '';
  currentUrl = '';
  urlParams = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUrl = window.location.href;
    this.urlParams = window.location.search || 'Nenhum parâmetro';
    
    console.log('=== LOGIN CALLBACK DEBUG ===');
    console.log('URL completa:', this.currentUrl);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    // Verificar se há erro nos parâmetros
    if (errorParam) {
      this.error = `Erro OAuth: ${errorParam}`;
      console.error('Erro OAuth recebido:', errorParam);
      setTimeout(() => this.router.navigate(['/']), 3000);
      return;
    }

    // Fallback: check URL hash fragment as well (e.g., #token=...)
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      token = hashParams.get('token');
      console.log('Token encontrado no hash:', token);
    }

    console.log('Token encontrado:', token ? 'SIM' : 'NÃO');

    if (token) {
      try {
        // Usar o AuthService para definir o token
        this.authService.setToken(token);
        this.message = 'Login realizado com sucesso! Redirecionando...';
        
        console.log('Token salvo com sucesso');

        // ✅ Se foi aberto como popup, envia evento para a janela original
        if (window.opener) {
          console.log('Enviando evento para janela pai');
          window.opener.postMessage({ type: 'login_success' }, window.location.origin);
          window.close(); // fecha o popup
        } else {
          // fallback: redireciona normalmente
          console.log('Redirecionando para /checkout');
          setTimeout(() => this.router.navigate(['/checkout']), 1000);
        }
      } catch (err) {
        console.error('Erro ao processar token:', err);
        this.error = 'Erro ao processar autenticação';
        setTimeout(() => this.router.navigate(['/']), 3000);
      }
    } else {
      this.error = 'Token não encontrado na URL';
      console.error('Token não encontrado. URL:', this.currentUrl);
      setTimeout(() => this.router.navigate(['/']), 3000);
    }
  }
}