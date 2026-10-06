import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsuariosService } from './usuarios.service';
import {
  createUsuarioSchema,
  CreateUsuarioDto
} from './schemas/create-usuario.schema';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUsuarioSchema))
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.createOne(createUsuarioDto);
  }
}
