import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { ProdutosService } from './produtos.service';
import { ProdutosController } from './produtos.controller';
import { ProdutoEntity, ProdutoSchema } from './schemas/produto.schema';

const isTestEnvironment = process.env.NODE_ENV === 'test';

@Module({
  imports: isTestEnvironment
    ? []
    : [
        MongooseModule.forFeature([
          { name: ProdutoEntity.name, schema: ProdutoSchema }
        ])
      ],
  providers: [
    ProdutosService,
    ...(isTestEnvironment
      ? [{ provide: getModelToken(ProdutoEntity.name), useValue: {} }]
      : [])
  ],
  controllers: [ProdutosController]
})
export class ProdutosModule {}
