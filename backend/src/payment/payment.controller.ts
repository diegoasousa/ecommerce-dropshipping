import { Controller, Post, Body, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { MercadoPagoService } from '../common/services/mercado-pago.service';
// Ajuste este import conforme a sua estrutura real
import { ProductsService } from '../products/products.service';

type CartItemInput = {
  productId: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
};

type CreatePreferenceByIdsDto = {
  customer?: { name?: string; email?: string };
  items: CartItemInput[];
};

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly productsService: ProductsService, // novo
  ) {}

  @Post('preference')
  async createPreference(@Body() body: any) {
    try {
      // Suporte para dois formatos:
      // 1. { items: [...] } - formato atual
      // 2. [...] - array direto (compatibilidade)
      let items: CartItemInput[];
      
      if (Array.isArray(body)) {
        // Formato array direto
        items = body;
      } else if (body && Array.isArray(body.items)) {
        // Formato com wrapper
        items = body.items;
      } else {
        throw new BadRequestException('Formato inválido. Esperado array de items ou objeto com propriedade items');
      }

      if (!items || !items.length) {
        throw new BadRequestException('items vazio ou ausente');
      }

      // Enriquecimento no servidor (fonte de verdade = banco)
      const enrichedItems = await Promise.all(
        items.map(async (it, idx) => {
          const productId = Number(it.productId);
          if (!productId || !Number.isFinite(productId)) {
            throw new BadRequestException(`productId inválido no item ${idx + 1}`);
          }

          const product = await this.productsService.findOne(productId);
          if (!product) {
            throw new BadRequestException(`Produto ${productId} não encontrado`);
          }

          // Verificação type-safe das propriedades do produto
          // O preço vem do PostgreSQL como string devido ao tipo decimal
          const price = Number(product.price);
          console.log(`Produto ${productId}: price raw = ${product.price}, price converted = ${price}, type = ${typeof product.price}`);
          
          if (!product.price || isNaN(price) || price <= 0) {
            console.error(`Preço inválido para produto ${productId}: raw=${product.price}, converted=${price}`);
            throw new InternalServerErrorException(`Preço inválido para o produto ${productId}`);
          }

          if (!product.name || typeof product.name !== 'string') {
            throw new InternalServerErrorException(`Nome inválido para o produto ${productId}`);
          }

          const quantity = Math.max(1, Number(it.quantity) || 1);
          const title = product.name;

          return {
            title,
            quantity,
            unit_price: price, // Usar o preço convertido para number
            currency_id: 'BRL',
            // Extra (opcional) — ajuda no painel do MP:
            // description: `Tamanho: ${it.selectedSize ?? '-'} | Cor: ${it.selectedColor ?? '-'}`,
            // picture_url: (product as any).imageUrl,
          };
        })
      );

      const preference = await this.mercadoPagoService.createPreference({ 
        items: enrichedItems,
        customer: body.customer 
      } as any);
      
      // Type-safe access to preference response
      const initPoint = preference.init_point || preference.sandbox_init_point;
        
      if (!initPoint) {
        throw new InternalServerErrorException('Erro ao obter link de pagamento do Mercado Pago');
      }
      
      return { init_point: initPoint };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('Erro ao criar preferência:', error);
      throw new InternalServerErrorException('Erro ao iniciar pagamento');
    }
  }
}