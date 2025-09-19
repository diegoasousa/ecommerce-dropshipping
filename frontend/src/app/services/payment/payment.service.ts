import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiBaseUrl}/payment`;

  constructor(private http: HttpClient) {}

  createPreference(order: any): Observable<{ init_point: string }> {
    return this.http.post<{ init_point: string }>(
      `${this.apiUrl}/preference`,
      order
    ).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('PaymentService Error:', error);
    return throwError(() => new Error(error.error?.message || 'Erro no pagamento'));
  }
}