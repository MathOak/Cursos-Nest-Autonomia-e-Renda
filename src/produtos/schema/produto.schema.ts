import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
export type ProdutoDocument = HydratedDocument<Produto>;
@Schema({ timestamps: true })
export class Produto {
  @Prop({ required: true, unique: true, trim: true })
  codigo!: string;
  @Prop({ required: true, trim: true })
  nome!: string;
  @Prop({ required: true, min: 0 })
  preco!: number;
  @Prop({ required: true, enum: ['Eletrônicos', 'Ferramentas', 'EPI'] })
  categoria!: string;
  @Prop({ default: 0, min: 0 })
  estoque!: number;
  @Prop({ default: true })
  ativo!: boolean;
}
export const ProdutoSchema = SchemaFactory.createForClass(Produto);
