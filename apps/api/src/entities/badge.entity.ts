import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: [
      'EARLY_BIRD',
      'COFFEE_ADDICT',
      'SUSTAINABILITY_CHAMPION',
      'APPRECIATION_STAR',
      'STREAK_MASTER',
      'FIRST_REDEMPTION',
    ],
  })
  name!: string;

  @Column()
  description!: string;

  @Column()
  criteria!: string;
}
