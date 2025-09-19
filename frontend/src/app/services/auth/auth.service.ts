import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

export interface AuthUser {
  name?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  avatarUrl?: string;
  // adicione outros campos do seu JWT se necessário (sub, exp, etc.)
}

export interface AutoLogoutOptions {
  /** minutos de inatividade para efetuar logout (default: 15) */
  idleMinutes?: number;
  /** se true, efetua logout ao fechar a aba/janela (default: true) */
  logoutOnWindowClose?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';

  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  /** Stream tipada do usuário logado (ou null). */
  public readonly user$: Observable<AuthUser | null> = this.userSubject.asObservable();

  // --- Auto logout / idle ---
  private idleTimeoutId: any;
  private activityUnsub?: () => void;
  private unloadUnsub?: () => void;
  private idleMinutes = 15; // default

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    // Hidrata o estado inicial a partir do token persistido
    this.hydrateUserFromToken();

    // Mantém sessões sincronizadas entre abas (logout/login em outra aba)
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (e) => {
        if (e.key === this.TOKEN_KEY) {
          this.hydrateUserFromToken();
        }
      });
    }
  }

  /** Configura auto-logout por inatividade e/ou ao fechar aba. */
  configureAutoLogout(opts: AutoLogoutOptions = {}): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const { idleMinutes = 15, logoutOnWindowClose = true } = opts;
    this.idleMinutes = idleMinutes;
    this.detachIdleWatchers();
    this.attachIdleWatchers();
    if (logoutOnWindowClose) {
      this.attachUnloadLogout();
    } else {
      this.detachUnloadLogout();
    }
  }

  /** Retorna o token JWT atual, se existir. */
  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(this.TOKEN_KEY) : null;
  }

  /** Define/substitui o token JWT e atualiza o usuário. */
  setToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.TOKEN_KEY, token);
    this.hydrateUserFromToken();
    // Ao logar, reinicia contagem de idle
    this.resetIdleTimer();
  }

  /** Indica se há sessão válida (baseado apenas na presença do token). */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /** Snapshot síncrono do usuário atual (pode ser null). */
  get userSnapshot(): AuthUser | null {
    return this.userSubject.value;
  }

  /** Retorna o usuário a partir do token no storage (compatível com código legado). */
  getUser(): AuthUser | null {
    return this.userSubject.value;
  }

  /** Efetua logout limpando token e estado local. */
  logout(navigate = true): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
    this.userSubject.next(null);
    this.resetIdleTimer(true);
    if (navigate) {
      // Evita navegar durante beforeunload; deixe quem chama decidir
      try { this.router.navigateByUrl('/'); } catch { /* noop */ }
    }
  }

  /** Tenta decodificar o payload do JWT (Base64URL). */
  private decodeJwtPayload(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      // Converte Base64URL -> Base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const json = atob(padded);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Lê o token do storage e atualiza o BehaviorSubject com os dados do usuário. */
  private hydrateUserFromToken(): void {
    const token = this.getToken();
    if (!token) {
      this.userSubject.next(null);
      return;
    }

    const decoded = this.decodeJwtPayload(token);
    if (!decoded) {
      this.userSubject.next(null);
      return;
    }

    // Mapeia campos comuns vindos do Google / backend
    const user: AuthUser = {
      name: decoded.name ?? decoded.given_name ?? decoded.preferred_username,
      displayName: decoded.name ?? decoded.given_name ?? decoded.preferred_username,
      email: decoded.email,
      photoURL: decoded.picture,
      avatarUrl: decoded.avatarUrl,
    };

    this.userSubject.next(user);
  }

  // ----------------- Idle helpers -----------------
  private attachIdleWatchers(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const events = ['click','mousemove','keydown','scroll','touchstart','visibilitychange'];
    const handler = () => this.resetIdleTimer();
    events.forEach(evt => window.addEventListener(evt, handler, { passive: true }));
    this.activityUnsub = () => events.forEach(evt => window.removeEventListener(evt, handler as any));
    this.resetIdleTimer();
  }

  private detachIdleWatchers(): void {
    if (this.activityUnsub) { this.activityUnsub(); this.activityUnsub = undefined; }
    this.resetIdleTimer(true);
  }

  private resetIdleTimer(clearOnly = false): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.idleTimeoutId) clearTimeout(this.idleTimeoutId);
    if (clearOnly) return;
    if (document.visibilityState !== 'visible') return;
    const ms = this.idleMinutes * 60 * 1000;
    this.idleTimeoutId = setTimeout(() => this.logout(), ms);
  }

  private attachUnloadLogout(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const handler = () => this.logout(false);
    window.addEventListener('beforeunload', handler);
    this.unloadUnsub = () => window.removeEventListener('beforeunload', handler);
  }

  private detachUnloadLogout(): void {
    if (this.unloadUnsub) { this.unloadUnsub(); this.unloadUnsub = undefined; }
  }
}