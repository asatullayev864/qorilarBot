import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { Qori } from './bot.model';

@Table({ tableName: 'daily_reads', timestamps: true })
export class DailyRead extends Model<InferAttributes<DailyRead>, InferCreationAttributes<DailyRead>> {
    declare id: CreationOptional<number>;

    @ForeignKey(() => Qori)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare qori_id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    declare pages: number;

    @Column({ type: DataType.DATE, allowNull: false })
    declare date: Date;

    @BelongsTo(() => Qori)
    declare qori: Qori;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}