import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  street: string;

  @Column()
  number: string;

  @Column({ nullable: true })
  complement: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  cep: string;
}