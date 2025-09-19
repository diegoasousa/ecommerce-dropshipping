import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToOne, JoinColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../users/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Address } from '../../users/address.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.orders, { onDelete: 'CASCADE' })
  user: User;

  @ManyToMany(() => Product, { eager: true }) // eager opcional
  @JoinTable()
  products: Product[];

  @OneToMany(() => OrderItem, item => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToOne(() => Address, { cascade: true, eager: true })
  @JoinColumn()
  address: Address;

  @Column('decimal')
  total: number;

  @Column({ type: 'enum', enum: ['Aguardando Pagamento', 'Em Processamento', 'Enviado'], default: 'Aguardando Pagamento' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
  
}