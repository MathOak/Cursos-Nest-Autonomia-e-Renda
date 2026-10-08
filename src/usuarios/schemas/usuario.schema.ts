import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<UsuarioEntity>;

@Schema({ timestamps: true, versionKey: false, collection: 'usuarios' })
export class UsuarioEntity {
  @Prop({ required: true, trim: true, minlength: 3 })
  nome: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, min: 18, max: 65, validate: Number.isInteger })
  idade: number;

  @Prop({ required: true, enum: ['TI', 'RH', 'Vendas'] })
  departamento: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(UsuarioEntity);
UsuarioSchema.set('toJSON', { virtuals: true, versionKey: false });
