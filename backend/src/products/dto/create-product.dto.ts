import { IsString, IsNotEmpty, IsNumber, Min, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ColorVariationDto {
  @IsString()
  @IsNotEmpty()
  colorName: string;

  @IsString()
  @IsNotEmpty()
  colorImage: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsNotEmpty()
  urlCssBuy: string;

  @IsString()
  @IsNotEmpty()
  sizes: string;

  @IsArray()
  @IsString({ each: true })
  images: string[]; // Agora aceita múltiplas imagens

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations: ColorVariationDto[]; // Cores com imagens associadas
}