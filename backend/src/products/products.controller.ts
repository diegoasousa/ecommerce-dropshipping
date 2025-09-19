import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UploadedFiles, UseInterceptors} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor({ // Permite até 10 imagens por upload via configuração do multer
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.includes('jpeg')) {
        return cb(new Error('Apenas imagens .jpg são permitidas!'), false);
      }
      cb(null, true);
    }
  }))
  async create(@UploadedFiles() files: Express.Multer.File[], @Body() productData: CreateProductDto): Promise<Product> {
    // Separar imagens do produto e imagens das variações de cor
    const productImages = files.filter(file => !file.fieldname.startsWith('colorVariations'));
    const colorImages = files.filter(file => file.fieldname.startsWith('colorVariations'));

    // Transformar variações de cor
    const colorVariations = (typeof productData.colorVariations === 'string' ? JSON.parse(productData.colorVariations) : productData.colorVariations).map((color, index) => ({
      colorName: color.colorName,
      colorImage: colorImages[index] ? `/uploads/${colorImages[index].filename}` : null
    }));

    // Criar o produto com as imagens processadas
    const newProduct = await this.productsService.create({
      ...productData,
      images: productImages.map(file => `/uploads/${file.filename}`), // Array de URLs de imagens
      colorVariations // Array de cores com imagens associadas
    });

    return newProduct;
  }

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: number, @Body() productData: Partial<Product>): Promise<Product> {
    return this.productsService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number): Promise<void> {
    return this.productsService.remove(id);
  }

}