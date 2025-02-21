import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @Column('json')
  products: Product[];

  @Column('decimal')
  total: number;

  @Column({ type: 'enum', enum: ['Aguardando Pagamento', 'Em Processamento', 'Enviado'], default: 'Aguardando Pagamento' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}