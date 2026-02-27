import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'admin_id', type: 'uuid' })
    adminId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'admin_id' })
    admin: User;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column({ name: 'entity_id', nullable: true })
    entityId: string;

    @Column('jsonb', { nullable: true })
    details: any;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
