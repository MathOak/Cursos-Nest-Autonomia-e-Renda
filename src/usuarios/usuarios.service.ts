import { Injectable, Logger } from '@nestjs/common';
import { CreateUsuarioDto } from './schemas/create-usuario.schema';

export type Usuario = CreateUsuarioDto & { id: string };

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);
  private readonly usuarios: Usuario[] = [];

  createOne(createUsuarioDto: CreateUsuarioDto): Usuario {
    const usuario: Usuario = {
      id: (this.usuarios.length + 1).toString(),
      ...createUsuarioDto
    };

    this.usuarios.push(usuario);
    this.logger.log(`Usuário ${usuario.id} cadastrado`);
    return usuario;
  }
}
