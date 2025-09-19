import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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

    private readonly dataSource: DataSource,
  ) {}

  private normalizeSizes(sizes?: string | string[] | null): string[] {
    if (!sizes) return [];
    if (Array.isArray(sizes))
      return sizes.map((s) => String(s).trim()).filter(Boolean);
    return String(sizes)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async create(productData: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { colorVariations, images, ...productDetails } = productData as any;

      const product = queryRunner.manager.create(Product, {
        ...productDetails,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        sizes: this.normalizeSizes(productDetails?.sizes),
      });

      const savedProduct = await queryRunner.manager.save(Product, product);

      if (colorVariations && Array.isArray(colorVariations)) {
        const colorEntities = colorVariations.map((color: any) =>
          queryRunner.manager.create(ProductColorVariation, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            colorName: color.colorName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            colorImage: color.colorImage,
            product: savedProduct,
          }),
        );
        await queryRunner.manager.save(ProductColorVariation, colorEntities);
      }

      if (images && Array.isArray(images)) {
        const imageEntities = images.map((imageUrl: string) =>
          queryRunner.manager.create(ProductImage, {
            url: imageUrl,
            product: savedProduct,
          }),
        );
        await queryRunner.manager.save(ProductImage, imageEntities);
      }

      await queryRunner.commitTransaction();
      // Recarrega com relations atualizadas
      return await this.findOne(savedProduct.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
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
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, productData: Partial<Product>): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await this.productRepository.findOne({
        where: { id },
        relations: ['colorVariations', 'images'],
      });
      if (!existing) {
        throw new NotFoundException(`Product with id ${id} not found`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { colorVariations, images, ...productDetails } = productData as any;

      Object.assign(existing, productDetails);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (productDetails?.sizes !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        existing.sizes = this.normalizeSizes(productDetails.sizes);
      }

      await queryRunner.manager.save(Product, existing);

      if (colorVariations) {
        await queryRunner.manager.delete(ProductColorVariation, {
          product: { id },
        });
        const colorEntities = (colorVariations as any[]).map((color) =>
          queryRunner.manager.create(ProductColorVariation, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            colorName: color.colorName,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            colorImage: color.colorImage,
            product: { id } as Product,
          }),
        );
        await queryRunner.manager.save(ProductColorVariation, colorEntities);
      }

      if (
        images &&
        Array.isArray(images) &&
        images.every((img) => typeof img === 'string')
      ) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        const imageEntities = images.map((imageUrl: string) =>
          queryRunner.manager.create(ProductImage, {
            url: imageUrl,
            product: { id } as Product,
          }),
        );
        await queryRunner.manager.save(ProductImage, imageEntities);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    // Garante 404 se não existir
    await this.findOne(id);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(ProductColorVariation, {
        product: { id },
      });
      await queryRunner.manager.delete(ProductImage, { product: { id } });
      await queryRunner.manager.delete(Product, { id });
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
