// src/products/product-color-variation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductColorVariation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  colorName: string; // Nome da cor

  @Column()
  colorImage: string; // URL da imagem da cor

  @ManyToOne(() => Product, (product) => product.colorVariations)
  product: Product;
}