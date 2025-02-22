import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProductsComponent } from './features/products/products.component';
import { OrdersComponent } from './features/orders/orders.component';
import { UsersComponent } from './features/users/users.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  //{ path: 'products', component: ProductsComponent },
  //{ path: 'orders', component: OrdersComponent },
  //{ path: 'users', component: UsersComponent },
  //{ path: '**', redirectTo: 'dashboard' }
];