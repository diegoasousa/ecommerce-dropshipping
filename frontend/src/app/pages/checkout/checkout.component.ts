import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // ✅ IMPORTANTE
import { AuthService } from '../../services/auth/auth.service'; // ✅ IMPORTANTE
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent {
  @Input() cart: any[] = [];
  @Input() customer: any;
  @Output() onSubmit = new EventEmitter<void>();
  cartItems: any;
  userName = '';

  constructor(private router: Router,
    private authService: AuthService
  ) {} 

  ngOnInit() {
    const state = history.state;
    this.cartItems = state.items || []; // Exibe os produtos enviados pelo "Comprar agora"
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getUser();
      this.userName = user?.name || '';
    }   
  }

  getTotal(): number {
    return this.cartItems.reduce((acc: number, item: any) => acc + item.price * (item.quantity || 1), 0);
  }

  loginWithGoogle() {
    window.location.href = `${environment.apiBaseUrl}/auth/google`;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }  


  async submitOrder() {
    // salva pedido normalmente
    const order = {
      customer: this.customer,
      items: this.cartItems.map((item: any) => {
        const raw = item?.price ?? item?.product?.price ?? item?.value ?? item?.amount ?? null;
        const price = typeof raw === 'number'
          ? raw
          : typeof raw === 'string'
            ? Number(
                raw
                  .toString()
                  .replace(/\s+/g, '')
                  .replace(/R\$|BRL|USD|\$/gi, '')
                  .replace(/\./g, '')
                  .replace(/,/g, '.')
              )
            : 0;
        const quantity = item.quantity || 1;
        return {
          productId: item.id ?? item.productId,
          name: item.name ?? item.title ?? item.product?.name ?? `Produto ${item.id ?? ''}`,
          quantity,
          price,             // ✅ preço unitário persistido
          total: price * quantity, // ✅ total por item persistido
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
        };
      }),
      total: this.cartItems.reduce((acc: number, it: any) => {
        const rawP = it?.price ?? it?.product?.price ?? it?.value ?? it?.amount ?? null;
        const p = typeof rawP === 'number'
          ? rawP
          : typeof rawP === 'string'
            ? Number(
                rawP
                  .toString()
                  .replace(/\s+/g, '')
                  .replace(/R\$|BRL|USD|\$/gi, '')
                  .replace(/\./g, '')
                  .replace(/,/g, '.')
              )
            : 0;
        const q = it.quantity || 1;
        return acc + (Number.isFinite(p) ? p : 0) * q;
      }, 0),
      createdAt: new Date().toISOString(),
    };
  
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));
  
    // Se já estiver logado, vai direto para pagamento
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/payment']);
      return;
    }
  
    // Caso contrário, abre popup de login
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;


    let cleanup: () => void;

    const onSuccess = () => {
      const user = this.authService.getUser();
      this.userName = user?.name || '';
      this.router.navigate(['/payment']);
      if (cleanup) cleanup();
    };

    // 1) Escuta mensagem do popup (postMessage)
    const messageHandler = (event: MessageEvent) => {
      // Aceita somente do frontend local (dev)
      if (event.origin !== 'http://localhost:4400') return;
      if (event.data?.type === 'login_success') {
        onSuccess();
      }
    };
    window.addEventListener('message', messageHandler);

    // 2) Escuta alterações no localStorage (caso o popup salve o token antes de enviar mensagem)
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'token' && event.newValue) {
        onSuccess();
      }
    };
    window.addEventListener('storage', storageHandler);

    cleanup = () => {
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('storage', storageHandler);
      if (timer) clearInterval(timer);
    };

  
    const popup = window.open(
      `${environment.apiBaseUrl}/auth/google`,
      'Login com Google',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  
    if (!popup) {
      cleanup();
      alert('Não foi possível abrir a janela de login');
      return;
    }
  
    // 3) Polling de fechamento do popup como fallback
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        const token = localStorage.getItem('token');
        if (token) {
          onSuccess();
        } else {
          alert('Login não foi concluído');
          cleanup();
        }
      }
    }, 500);


  }
}