// src/bot/models/bot.model.ts
import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

@Table({ tableName: 'qorilar', timestamps: true })
export class Qori extends Model<InferAttributes<Qori>, InferCreationAttributes<Qori>> {
    declare id: CreationOptional<number>;

    @Column({ type: DataType.STRING, allowNull: false })
    declare full_name: string;

    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    declare username: string;

    @Column({ type: DataType.STRING, allowNull: true })
    declare phone_number: string | null;

    @Column({ type: DataType.STRING, defaultValue: "a'zo" })
    declare status: string;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}