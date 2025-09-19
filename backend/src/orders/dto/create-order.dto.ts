import { IsString, IsNotEmpty, IsNumber, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNumber()
  @Min(1)
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  selectedColor?: string;

  @IsString()
  @IsOptional()
  selectedSize?: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber()
  @Min(1)
  userId: number;

  @IsString()
  @IsNotEmpty()
  status: string;
}