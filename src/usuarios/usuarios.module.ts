import { Module } from '@nestjs/common';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { UsuarioEntity, UsuarioSchema } from './schemas/usuario.schema';

const isTestEnvironment = process.env.NODE_ENV === 'test';

@Module({
  imports: isTestEnvironment
    ? []
    : [
        MongooseModule.forFeature([
          { name: UsuarioEntity.name, schema: UsuarioSchema }
        ])
      ],
  controllers: [UsuariosController],
  providers: [
    UsuariosService,
    ...(isTestEnvironment
      ? [{ provide: getModelToken(UsuarioEntity.name), useValue: {} }]
      : [])
  ]
})
export class UsuariosModule {}
