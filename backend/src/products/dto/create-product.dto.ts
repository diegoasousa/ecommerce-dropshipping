export class CreateProductDto {
  name: string;
  description: string;
  price: number;
  urlCssBuy: string;
  sizes: string;
  images: string[]; // Agora aceita múltiplas imagens
  colorVariations: { colorName: string; colorImage: string }[]; // Cores com imagens associadas
}