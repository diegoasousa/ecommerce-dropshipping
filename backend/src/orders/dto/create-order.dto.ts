export class CreateOrderDto {
  userId: number;
  products: { id: number; quantity: number }[];
}