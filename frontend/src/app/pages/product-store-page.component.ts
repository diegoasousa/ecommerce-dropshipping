import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product.model';
import { AssetUrlPipe } from '../pipes/asset-url.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-store-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AssetUrlPipe],
  templateUrl: './product-store-page.component.html',
  styleUrls: ['./product-store-page.component.scss'],
})
export class ProductStorePageComponent implements OnInit {
  cart: any[] = [];
  private productService = inject(ProductService);
  private assetUrlPipe: AssetUrlPipe = inject(AssetUrlPipe);
  products: Product[] = [];

  constructor(
    public router: Router
  ) {}

  selectedImageMap: Record<number, string> = {};
  selectedColorMap: Record<number, string> = {};
  selectedSizeMap: Record<number, string> = {};

  ngOnInit(): void {
    this.productService.getProducts().subscribe((res) => {
      this.products = res;
    });
  }

  buyNow(product: Product) {
    console.log('buyNow chamado para produto:', product); // Debug
    
    const selectedSize = this.selectedSizeMap[product.id];
    const selectedColor = this.selectedColorMap[product.id];

    console.log('selectedSize:', selectedSize); // Debug
    console.log('selectedColor:', selectedColor); // Debug
    console.log('product.sizes:', product.sizes); // Debug
    console.log('product.colorVariations:', product.colorVariations); // Debug

    // Verifica se há variações de cor e se uma foi selecionada
    if (product.colorVariations?.length && !selectedColor) {
      alert('Selecione uma cor!');
      return;
    }
  
    // Verifica se há tamanhos e se um foi selecionado
    if (product.sizes?.length && !selectedSize) {
      alert('Selecione um tamanho!');
      return;
    }
  
    const orderItem = {
      ...product,
      selectedSize,
      selectedColor,
      quantity: product.quantity || 1
    };

    console.log('Navegando para checkout com item:', orderItem); // Debug
  
    this.router.navigate(['/checkout'], {
      state: { items: [orderItem] }
    });
  }

 
  selectImage(productId: number, imageUrl: string) {
    this.selectedImageMap[productId] = this.assetUrlPipe.transform(imageUrl);
  }

  selectColor(productId: number, imageUrl: string) {
    this.selectedColorMap[productId] = this.assetUrlPipe.transform(imageUrl);
    this.selectedImageMap[productId] = this.assetUrlPipe.transform(imageUrl);
  }

  selectSize(productId: number, size: string) {
    this.selectedSizeMap[productId] = size;
  }


  increaseQuantity(product: Product) {
    if (!product.quantity) product.quantity = 1;
    if (product.quantity < 10) product.quantity++;
  }

  decreaseQuantity(product: Product) {
    if (!product.quantity) product.quantity = 1;
    if (product.quantity > 1) product.quantity--;
  }
}