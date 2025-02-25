import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductColorVariation } from './entities/product-color-variation.entity';
import { ProductImage } from './entities/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    @InjectRepository(ProductColorVariation)
    private colorVariationRepository: Repository<ProductColorVariation>,

    @InjectRepository(ProductImage)
    private productImageRepository: Repository<ProductImage>,
  ) {}

  async create(productData: CreateProductDto): Promise<Product> {
    const { colorVariations, images, ...productDetails } = productData;
  
    const product = this.productRepository.create(productDetails);
    const savedProduct = await this.productRepository.save(product);
  
    if (colorVariations) {
      const colorEntities = colorVariations.map((color) =>
        this.colorVariationRepository.create({ 
          colorName: color.colorName, 
          colorImage: color.colorImage, 
          product: savedProduct 
        })
      );
      await this.colorVariationRepository.save(colorEntities);
      savedProduct.colorVariations = colorEntities;
    }
  
    if (images) {
      const imageEntities = images.map((imageUrl) =>
        this.productImageRepository.create({ url: imageUrl, product: savedProduct } as Partial<ProductImage>)
      );
      await this.productImageRepository.save(imageEntities);
      savedProduct.images = imageEntities;
    }
  
    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['colorVariations', 'images'],
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['colorVariations', 'images'],
    });
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const { colorVariations, images, ...productDetails } = productData;
  
    await this.productRepository.update(id, productDetails);
    const updatedProduct = await this.findOne(id);
  
    if (colorVariations) {
      await this.colorVariationRepository.delete({ product: { id } });
      const colorEntities = colorVariations.map((color) =>
        this.colorVariationRepository.create({ 
          colorName: color.colorName, 
          colorImage: color.colorImage, 
          product: updatedProduct 
        })
      );
      await this.colorVariationRepository.save(colorEntities);
      updatedProduct.colorVariations = colorEntities;
    }
  
    if (images && Array.isArray(images) && images.every(img => typeof img === 'string')) {
      await this.productImageRepository.delete({ product: { id } });
  
      const imageEntities = images.map((imageUrl: string) =>
        this.productImageRepository.create({ url: imageUrl, product: updatedProduct })
      );
      
      await this.productImageRepository.save(imageEntities);
      updatedProduct.images = imageEntities;
    }
  
    return updatedProduct;
  }

  async remove(id: number): Promise<void> {
    await this.colorVariationRepository.delete({ product: { id } });
    await this.productImageRepository.delete({ product: { id } });
    await this.productRepository.delete(id);
  }
}