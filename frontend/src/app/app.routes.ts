import { Routes } from '@angular/router';
import { ProductStorePageComponent } from './pages/product-store-page.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { PaymentComponent } from './pages/payment/payment.component'; 
import { LoginCallbackComponent } from './pages/login-callback/login-callback.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ProductStorePageComponent, // Home = vitrine de produtos,
  },
  { 
    path: 'checkout', 
    component: CheckoutComponent
  },
  { 
    path: 'payment', 
    component: PaymentComponent
  },
  { path: 'login/callback', component: LoginCallbackComponent },
  { path: 'login-callback', component: LoginCallbackComponent }
];