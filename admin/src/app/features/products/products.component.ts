import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-products',
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent {

  private baseUrl = environment.apiUrl;

  product = {
    name: '',
    description: '',
    price: null,
    urlCssBuy: '',
    images: '',
    colorVariations: '',
    sizes: ''
  };

  constructor(private http: HttpClient) {}

  createProduct() {
    const payload = {
      ...this.product,
      price: parseFloat(this.product.price as unknown as string),
      images: this.product.images.split(',').map(img => img.trim()),
      colorVariations: this.product.colorVariations.split(',').map(color => {
        const [colorName, colorImage] = color.split('|');
        return { colorName: colorName.trim(), colorImage: colorImage.trim() };
      }),
      sizes: this.product.sizes.split(',').map(size => size.trim())
    };

    this.http.post(`${this.baseUrl}/products/create`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: () => alert('Produto criado com sucesso!'),
      error: (err) => alert('Erro ao criar produto: ' + err.message)
    });
  }

}
