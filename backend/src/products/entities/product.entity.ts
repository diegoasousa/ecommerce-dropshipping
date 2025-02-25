import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductImage } from './product-image.entity';
import { ProductColorVariation } from './product-color-variation.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  urlCssBuy: string;

  @OneToMany(() => ProductColorVariation, (colorVariation) => colorVariation.product, { cascade: true })
  colorVariations: ProductColorVariation[]; // Relacionamento com as variações de cor

  @Column('simple-array')
  sizes: string[]; // Array de tamanhos disponíveis

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[]; // Relacionamento com a entidade ProductImage
}