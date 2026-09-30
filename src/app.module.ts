//src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module';
import { ProdutosController } from './produtos/produtos.controller';
import { AuthMiddleware } from './auth/auth.middleware';

@Module({
  imports: [ProdutosModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Aplica o middleware às rotas do controller de produtos.
    consumer.apply(AuthMiddleware).forRoutes(ProdutosController);
  }
}
