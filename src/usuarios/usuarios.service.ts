// src\usuarios\usuarios.service.ts
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UsuarioEntity } from './schemas/usuario.schema';

export type Usuario = CreateUsuarioDto & { id: string };

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectModel(UsuarioEntity.name)
    private readonly usuarioModel: Model<UsuarioEntity>
  ) {}

  async createOne(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    try {
      const usuario = await this.usuarioModel.create(createUsuarioDto);
      this.logger.log(`Usuário ${usuario._id.toString()} cadastrado`);
      return {
        id: usuario._id.toString(),
        nome: usuario.nome,
        email: usuario.email,
        idade: usuario.idade,
        departamento: usuario.departamento as CreateUsuarioDto['departamento']
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Já existe um usuário com este e-mail');
      }
      throw error;
    }
  }
}
