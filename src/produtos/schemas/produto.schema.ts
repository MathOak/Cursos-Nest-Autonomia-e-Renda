import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProdutoDocument = HydratedDocument<ProdutoEntity>;

@Schema({ timestamps: true, versionKey: false, collection: 'produtos' })
export class ProdutoEntity {
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: true, min: 0 })
  preco: number;

  @Prop({ required: true, trim: true, index: true })
  categoria: string;

  @Prop({ type: String, default: null })
  imagem?: string | null;
}

export const ProdutoSchema = SchemaFactory.createForClass(ProdutoEntity);
ProdutoSchema.set('toJSON', { virtuals: true, versionKey: false });
