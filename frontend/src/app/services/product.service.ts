import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';

export interface OrderItem {
  productId: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  price: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  customerEmail?: string;
  shippingAddress?: {
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
    cep: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiBaseUrl}/products`;
  private ordersUrl = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createOrder(orderData: CreateOrderRequest): Observable<any> {
    return this.http.post<any>(this.ordersUrl, orderData).pipe(
      catchError(this.handleError)
    );
  }

  getOrder(id: string): Observable<any> {
    return this.http.get<any>(`${this.ordersUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('ProductService Error:', error);
    return throwError(() => new Error(error.error?.message || 'Erro no servidor'));
  }
}