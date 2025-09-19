export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  urlCssBuy: string;
  colorVariations: ColorVariation[];
  sizes: string[];
  images: ProductImage[];
  quantity?: number;
}

export interface ColorVariation {
  id: number;
  colorName: string;
  colorImage: string;
}

export interface ProductImage {
  id: number;
  url: string;
}