import { Component, OnInit } from '@angular/core';
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
export class ProductsComponent implements OnInit {

  private baseUrl = environment.apiUrl;
  selectedFiles: File[] = []; // Para armazenar as imagens
  colorVariations: { colorName: string; file?: File }[] = []; // Para armazenar cores e imagens
  products: any[] = [];
  editingProductId: number | null = null;
  showProductForm: boolean = false;

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

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.http.get<any[]>(`${this.baseUrl}/products`).subscribe({
      next: (res) => this.products = res,
      error: (err) => alert('Erro ao carregar produtos: ' + err.message)
    });
  }

  // Captura os arquivos selecionados e verifica a extensão
  onFilesSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const files = Array.from(fileInput.files);

      // Filtrar apenas arquivos .jpg
      const validFiles = files.filter(file => file.name.endsWith('.jpg'));

      if (validFiles.length !== files.length) {
        alert('Apenas arquivos .jpg são permitidos!');
      }

      this.selectedFiles = validFiles;
      console.log('Imagens selecionadas:', this.selectedFiles);
    }
  }

   // Captura a imagem da cor selecionada
   onColorImageSelected(event: Event, index: number) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];

      if (!file.name.endsWith('.jpg')) {
        alert('Apenas arquivos .jpg são permitidos!');
        return;
      }

      this.colorVariations[index].file = file;
      console.log(`Imagem da cor ${this.colorVariations[index].colorName} selecionada:`, file);
    }
  }
  
    // Adiciona uma nova variação de cor
    addColorVariation() {
      this.colorVariations.push({ colorName: '', file: undefined });
    }

  // Envia a imagem para o backend e cria o produto
  createProduct() {
    if (this.selectedFiles.length === 0) {
      alert('Selecione uma imagem .jpg antes de criar o produto.');
      return;
    }

    if (this.colorVariations.some(cv => !cv.colorName || !cv.file)) {
      alert('Preencha todas as cores e selecione suas imagens.');
      return;
    }

    const formData = new FormData();
    this.selectedFiles.forEach(file => {
      formData.append('files', file); // O backend receberá como um array de arquivos
    });
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);
    formData.append('price', this.product.price as unknown as string);
    formData.append('urlCssBuy', this.product.urlCssBuy);

    
    // Monta JSON de variações sem os arquivos
    const colorVariationData = this.colorVariations.map(cv => ({
      colorName: cv.colorName
    }));
    formData.append('colorVariations', JSON.stringify(colorVariationData));

    // Anexa as imagens das variações utilizando índice para nomes dos campos conforme esperado pelo backend
    this.colorVariations.forEach((variation, index) => {
      formData.append(`colorVariations${index}`, variation.file!);
    });
    formData.append('sizes', this.product.sizes);

    this.http.post(`${this.baseUrl}/products`, formData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).subscribe({
      next: () => alert('Produto criado com sucesso!'),
      error: (err) => alert('Erro ao criar produto: ' + err.message)
    });
  }

  editProduct(item: any) {
    this.editingProductId = item.id;
    this.product = {
      name: item.name,
      description: item.description,
      price: item.price,
      urlCssBuy: item.urlCssBuy,
      images: '',
      colorVariations: '',
      sizes: item.sizes
    };
  }

  submitProduct() {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    if (this.editingProductId) {
      const payload = {
        name: this.product.name,
        description: this.product.description,
        price: this.product.price,
        urlCssBuy: this.product.urlCssBuy,
        sizes: this.product.sizes
      };
      this.http.put(`${this.baseUrl}/products/${this.editingProductId}`, payload, { headers }).subscribe({
        next: () => {
          alert('Produto atualizado com sucesso!');
          this.resetForm();
          this.loadProducts();
        },
        error: (err) => alert('Erro ao atualizar produto: ' + err.message)
      });
    } else {
      this.createProduct();
    }
  }

  resetForm() {
    this.product = {
      name: '',
      description: '',
      price: null,
      urlCssBuy: '',
      images: '',
      colorVariations: '',
      sizes: ''
    };
    this.selectedFiles = [];
    this.colorVariations = [];
    this.editingProductId = null;
  }

  getColorNames(item: any): string {
    return item.colorVariations?.map((c: any) => c.colorName).join(', ') || '';
  }

  deleteProduct(id: number) {
    const confirmDelete = confirm('Tem certeza que deseja excluir este produto?');
    if (!confirmDelete) return;
  
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
  
    this.http.delete(`${this.baseUrl}/products/${id}`, { headers }).subscribe({
      next: () => {
        alert('Produto excluído com sucesso!');
        this.loadProducts();
      },
      error: (err) => alert('Erro ao excluir produto: ' + err.message)
    });
  }

}
