//src/app.module.ts
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProdutosModule } from './produtos/produtos.module';
import { ProdutosController } from './produtos/produtos.controller';
import { AuthMiddleware } from './auth/auth.middleware';
import { UsuariosModule } from './usuarios/usuarios.module';

const mongoMode = process.env.MONGO_MODE ?? 'local';
const isTestEnvironment = process.env.NODE_ENV === 'test';
const databaseModules = isTestEnvironment
  ? []
  : [
      MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const uri =
            configService.get<string>('MONGODB_URI') ??
            (mongoMode === 'local'
              ? 'mongodb://127.0.0.1:27017/ecommerce'
              : undefined);

          if (!uri) {
            throw new Error(
              'MONGODB_URI não configurada. Defina a URI do Atlas no arquivo .env.atlas.'
            );
          }

          return {
            uri,
            connectionFactory: (connection: Connection) => {
              const logger = new Logger('MongoDB');
              connection.on('connected', () =>
                logger.log(`Conectado ao MongoDB no modo ${mongoMode}`)
              );
              connection.on('error', () =>
                logger.error('Falha na conexão ou em uma operação MongoDB')
              );
              connection.on('disconnected', () =>
                logger.warn('Conexão com MongoDB encerrada')
              );
              return connection;
            }
          };
        }
      })
    ];

if (mongoMode !== 'local' && mongoMode !== 'atlas') {
  throw new Error('MONGO_MODE deve ser "local" ou "atlas".');
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${mongoMode}`
    }),
    ...databaseModules,
    ProdutosModule,
    UsuariosModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Aplica o middleware às rotas do controller de produtos.
    consumer.apply(AuthMiddleware).forRoutes(ProdutosController);
  }
}
