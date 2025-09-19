import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './../orders/entities/order.entity';
import { Address } from './address.entity';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) // ✅ agora pode ser nulo para login social
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  role: UserRole;

  @Column({ nullable: true }) // ✅ nome do provedor de login (google, facebook, etc)
  provider: string;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToOne(() => Address, { cascade: true })
  @JoinColumn()
  address: Address;
}