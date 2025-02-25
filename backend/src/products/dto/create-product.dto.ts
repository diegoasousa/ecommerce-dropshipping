import { Product } from '../entities/product.entity';

export class CreateProductDto {
  name: string;
  description?: string;
  price: number;
  urlCssBuy: string;
  images: string[];
  colorVariations: { id: number; colorName: string; colorImage: string; product?: Product; }[];
  sizes: string[];
}
