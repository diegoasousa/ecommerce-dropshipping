import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { PaymentService } from '../../services/payment/payment.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  providers: [PaymentService]
})
export class PaymentComponent implements OnInit {
  email = '';
  address = '';
  cep = '';
  street = '';
  number = '';
  complement = '';
  city = '';
  state = '';
  
  // Propriedades para controle de autenticação
  isLoggedIn = false;
  userName = '';
  userAvatarUrl = '';
  

  constructor(private router: Router, private paymentService: PaymentService, private authService: AuthService) {}

  ngOnInit(): void {
    // Verificar se o usuário está logado
    this.authService.user$.subscribe((user) => {
      this.isLoggedIn = !!user;
      this.userName = user?.displayName ?? user?.name ?? '';
      this.userAvatarUrl = user?.photoURL ?? user?.avatarUrl ?? '';
      
      if (user?.email) {
        this.email = user.email;
        console.log('[PAYMENT] email via AuthService:', this.email);
        return;
      }
    });

    // Se não estiver logado via AuthService, tenta via JWT
    if (!this.isLoggedIn) {
      // 1) Tenta obter via AuthService
      const user = this.authService?.getUser?.();    
      console.log("user", user);
      if (user?.email) {
        this.email = user.email;
        console.log('[PAYMENT] email via AuthService:', this.email);
        return;
      }

      // 2) Tenta via JWT no localStorage ou cookie
      let token: string | null = localStorage.getItem('token');
      if (!token) {
        const m = document.cookie.match(/(?:^|; )auth_token=([^;]+)/);
        if (m) token = decodeURIComponent(m[1]);
      }
      if (token) {
        const payload: any = this.safeDecodeJwt(token);
        const jwtEmail = payload?.email ?? payload?.user?.email ?? payload?.sub?.email ?? null;
        if (jwtEmail) {
          this.email = jwtEmail;
          console.log('[PAYMENT] email via JWT:', this.email);
          return;
        }
      }

      // 2.1) Tenta via API (cookie HttpOnly)
      this.loadEmailFromApi().then(found => {
        if (found) return;
        // 3) Último recurso: usa e-mail do último pedido salvo (se existir)
        try {
          const orders = JSON.parse(localStorage.getItem('orders') || '[]');
          const lastOrder = orders[orders.length - 1];
          const emailFromOrder = lastOrder?.customer?.email;
          if (emailFromOrder) {
            this.email = emailFromOrder;
            console.log('[PAYMENT] email via último pedido:', this.email);
          }
        } catch { /* ignore */ }
      });   
    }
  }

  private safeDecodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private async loadEmailFromApi(): Promise<boolean> {
    try {
      const res = await fetch(`${environment.apiBaseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => null);
      const e = data?.email ?? data?.user?.email ?? null;
      if (e) {
        this.email = e;
        console.log('[PAYMENT] email via /auth/me:', this.email);
        return true;
      }
    } catch (err) {
      console.warn('[PAYMENT] /auth/me failed', err);
    }
    return false;
  }


  onCepBlur(): void {
    const cleanedCep = this.cep.replace(/\D/g, '');
  
    if (cleanedCep.length !== 8) {
      alert('CEP inválido. Deve conter 8 dígitos.');
      return;
    }
  
    fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
      .then(response => response.json())
      .then(data => {
        if (data.erro) {
          alert('CEP não encontrado.');
          return;
        }
  
        this.street = data.logradouro || '';
        this.city = data.localidade || '';
        this.state = data.uf || '';
        this.complement = data.complemento || '';
      })
      .catch(error => {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar informações do CEP.');
      });
  }

  submitPayment() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const lastOrder = orders[orders.length - 1];
  
    if (!lastOrder) {
      alert('Nenhum pedido encontrado.');
      return;
    }
  
    // 👀 Ajuda a depurar o formato dos itens que vieram do carrinho
    console.log('[PAYMENT] lastOrder.items ===>');
    console.table(lastOrder.items);
    console.log('[PAYMENT] lastOrder completo:', lastOrder);
  
    const parsePrice = (v: any): number => {
      if (v === null || v === undefined) return NaN;
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const cleaned = v
          .replace(/\s+/g, '')
          .replace(/R\$|BRL|USD|\$/gi, '')
          .replace(/\./g, '')
          .replace(/,/g, '.');
        const n = Number(cleaned);
        return isFinite(n) ? n : NaN;
      }
      return NaN;
    };
  
    
    const getNested = (obj: any, path: string): any => {
      return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
    };

    const resolvePrice = (item: any): number => {
        console.log(`[PAYMENT] Resolvendo preço para item:`, item);
        
        // Se houver total e quantidade, derivar preço unitário
        if (item && (item.total != null || item.totalPrice != null) && item.quantity) {
          const tot = parsePrice(item.total ?? item.totalPrice);
          const qty = Number(item.quantity) || 1;
          const unit = tot / qty;
          console.log(`[PAYMENT] Preço derivado de total: ${tot} / ${qty} = ${unit}`);
          if (isFinite(unit) && unit > 0) return unit;
        }

        const paths = [
          'price', 'unit_price', 'value', 'amount', 'preco', 'valor',
          'priceInCents', 'unitPriceInCents',
          'price.amount', 'price.value',
          'product.price', 'product.priceInCents',
          'variant.price', 'selectedVariant.price', 'selectedSize.price', 'selectedColor.price',
        ];

        for (const p of paths) {
          const val = getNested(item, p);
          if (val == null) continue;
          
          console.log(`[PAYMENT] Testando campo '${p}': ${val}`);
          
          if (/cents/i.test(p)) {
            const cents = Number(val);
            if (isFinite(cents) && cents > 0) {
              const price = cents / 100;
              console.log(`[PAYMENT] Preço em centavos convertido: ${cents} cents = ${price}`);
              return price;
            }
            continue;
          }
          const n = parsePrice(val);
          if (isFinite(n) && n > 0) {
            console.log(`[PAYMENT] Preço encontrado em '${p}': ${n}`);
            return n;
          }
        }
        
        console.warn(`[PAYMENT] Nenhum preço válido encontrado para o item`);
        return NaN;
    };    const itemsRaw: any[] = Array.isArray(lastOrder.items) ? lastOrder.items : [];
    const mapped = itemsRaw.map((item, idx) => {
      console.log(`[PAYMENT] Processando item ${idx + 1}:`, item);
      
      const price = resolvePrice(item);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const name = item.name || item.title || item.productName || getNested(item, 'product.name') || `Item ${idx + 1}`;
      const productId = item.productId || item.id || `product_${idx + 1}`;
      
      console.log(`[PAYMENT] Item ${idx + 1} processado - productId: ${productId}, name: ${name}, price: ${price}, quantity: ${quantity}`);
      
      if (!isFinite(price) || price <= 0) {
        console.error(`[PAYMENT] Preço inválido para item ${idx + 1}:`, {
          productId,
          name,
          priceResolved: price,
          originalItem: item
        });
        
        try {
          const preview = {
            idx,
            priceHints: {
              price: item?.price,
              unit_price: item?.unit_price,
              value: item?.value,
              amount: item?.amount,
              preco: item?.preco,
              valor: item?.valor,
              priceInCents: item?.priceInCents,
              unitPriceInCents: item?.unitPriceInCents,
              total: item?.total ?? item?.totalPrice,
              quantity: item?.quantity,
              product_price: item?.product?.price,
            },
            keys: item && typeof item === 'object' ? Object.keys(item) : [],
          };
          if (typeof console !== 'undefined' && console.warn) {
            console.warn('[PAYMENT] preço inválido para item', preview);
          }
        } catch {}
      }
      return { productId, name, quantity, price };
    });
  
    const invalid = mapped.filter(i => !isFinite(i.price) || i.price <= 0);

    // Fallback secundário: se todos inválidos mas existir total no pedido, usar média
    if (invalid.length === mapped.length && (lastOrder.total || lastOrder.amount || lastOrder.valor)) {
      const orderTotal = parsePrice(lastOrder.total ?? lastOrder.amount ?? lastOrder.valor);
      const qtySum = itemsRaw.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0) || 1;
      const unitAvg = orderTotal / qtySum;
      if (isFinite(unitAvg) && unitAvg > 0) {
        for (let i = 0; i < mapped.length; i++) {
          mapped[i].price = unitAvg;
          // Manter o productId durante o fallback
          if (!mapped[i].productId) {
            mapped[i].productId = itemsRaw[i]?.productId || itemsRaw[i]?.id || `product_${i + 1}`;
          }
        }
      }
    }
      
    if (invalid.length === mapped.length) {
      // tudo inválido → mostra quais campos vieram
      console.warn('[PAYMENT] Todos os itens sem preço válido. Itens recebidos:', itemsRaw);
      alert('Não consegui identificar o preço dos itens do pedido. Confira o carrinho e tente novamente.');
      return;
    }
    if (invalid.length) {
      console.warn('[PAYMENT] Ignorando itens sem preço válido:', invalid);
      alert(`Alguns itens foram ignorados por falta de preço: ${invalid.map(i => i.name).join(', ')}`);
    }
  
    const payload = {
      customer: {
        name: this.email || lastOrder.customer?.name || '',
        email: this.email || lastOrder.customer?.email || '',
      },
      items: mapped
        .filter(i => {
          const isValidPrice = isFinite(i.price) && i.price > 0;
          if (!isValidPrice) {
            console.error(`[PAYMENT] Item filtrado por preço inválido:`, i);
          }
          return isValidPrice;
        })
        .map(item => {
          // Garantir que o preço seja um número com 2 casas decimais
          const cleanPrice = Math.round(Number(item.price) * 100) / 100;
          // Garantir que a quantidade seja um inteiro positivo
          const cleanQuantity = Math.max(1, Math.floor(Number(item.quantity)));
          
          const cleanItem = {
            productId: String(item.productId),
            name: String(item.name),
            quantity: cleanQuantity,
            price: cleanPrice
          };
          
          // Validação adicional para garantir compatibilidade com backend
          if (!cleanItem.productId || cleanItem.productId === 'undefined' || cleanItem.productId === 'null') {
            console.error(`[PAYMENT] ProductId inválido para item:`, item);
            return null; // Retorna null para ser filtrado
          }
          
          if (!isFinite(cleanItem.price) || cleanItem.price <= 0) {
            console.error(`[PAYMENT] Preço inválido após limpeza para item ${cleanItem.productId}:`, cleanItem.price);
            return null; // Retorna null para ser filtrado
          }
          
          // Log específico para produto ID 3 para debugar
          if (cleanItem.productId === '3') {
            console.log(`[PAYMENT] 🔍 PRODUTO 3 DETECTADO:`, {
              originalItem: item,
              cleanItem: cleanItem,
              priceType: typeof cleanItem.price,
              priceValue: cleanItem.price,
              priceInCents: Math.round(cleanItem.price * 100),
              isFinite: isFinite(cleanItem.price),
              isPositive: cleanItem.price > 0
            });
          }
          
          console.log(`[PAYMENT] Item limpo e validado:`, cleanItem);
          return cleanItem;
        })
    };

    console.log('[PAYMENT] Payload enviado para backend:', payload);
    console.log('[PAYMENT] Items que serão enviados:', payload.items);
    
    // Validação final antes de enviar
    if (payload.items.length === 0) {
      alert('Nenhum item válido encontrado para processar o pagamento.');
      return;
    }
    
    // Verificar se todos os itens têm preços válidos
    const invalidPriceItems = payload.items.filter(item => item && (!isFinite(item.price) || item.price <= 0));
    if (invalidPriceItems.length > 0) {
      console.error('[PAYMENT] Items com preços inválidos detectados:', invalidPriceItems);
      alert('Alguns itens possuem preços inválidos. Verifique o carrinho e tente novamente.');
      return;
    }
  
    const useCookieAuth = true;
  
    fetch(`${environment.apiBaseUrl}/payment/preference`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(useCookieAuth ? {} : { Authorization: `Bearer ${localStorage.getItem('token')}` }),
      },
      body: JSON.stringify(payload),
      ...(useCookieAuth ? { credentials: 'include' as RequestCredentials } : {}),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw data;
        return data;
      })
      .then(data => {
        const url = data.init_point || data.sandbox_init_point;
        if (!url) {
          console.error('Resposta inesperada da preferência:', data);
          alert('Não foi possível iniciar o checkout. Tente novamente.');
          return;
        }
        window.location.href = url;
      })
      .catch(err => {
        console.error('Erro ao criar preferência:', err);
        const msg = err?.message || err?.details?.message || JSON.stringify(err);
        alert('Erro ao criar preferência: ' + msg);
      });
  }

  beginGoogleLogin() {
    console.log('=== INICIANDO LOGIN GOOGLE ===');
    const base = (environment as any)?.apiBaseUrl || (environment as any)?.apiUrl || '';
    const oauthPath = '/auth/google';
    const target = base ? `${base}${oauthPath}` : oauthPath;
    
    console.log('URL base:', base);
    console.log('URL completa de login:', target);
    
    // Redirecionar diretamente sem verificação prévia (evita problemas de CORS)
    try {
      window.location.href = target;
    } catch (error) {
      console.error('Erro ao redirecionar:', error);
      alert('Erro ao iniciar autenticação. Tente novamente.');
    }
  }

  logout() {
    this.authService.logout();
  }
}