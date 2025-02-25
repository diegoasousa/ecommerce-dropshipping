import { Entity, PrimaryGeneratedColumn, Column, OneToMany,OneToOne,JoinColumn } from 'typeorm';
import { Order } from './../orders/entities/order.entity';
import { Address } from './adress.entity';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  role: UserRole;  

  @OneToMany(() => Order, order => order.user)
  orders: Order[];
  
  @OneToOne(() => Address, { cascade: true })
  @JoinColumn()
  address: Address;
}