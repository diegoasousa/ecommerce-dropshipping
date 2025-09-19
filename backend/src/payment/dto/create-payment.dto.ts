import { IsString, IsNotEmpty, IsNumber, Min, IsArray, ValidateNested, IsEmail, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

class PaymentItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreatePaymentDto {
  @ValidateNested()
  @Type(() => CustomerDto)
  @IsOptional()
  customer?: CustomerDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];
}