import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from './Tenants.js'

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column('varchar', { length: 255 })
    firstName: string

    @Column('varchar', { length: 255 })
    lastName: string

    @Column('varchar', { length: 255, unique: true })
    email: string

    @Column('varchar', { length: 255, select: false })
    password: string

    @Column('varchar', { length: 64 })
    role: string

    @ManyToOne(() => Tenant)
    tenant: Tenant | null
}
