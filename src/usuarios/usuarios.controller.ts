// src\usuarios\usuarios.controller.ts
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UsuariosService } from './usuarios.service';
import {
  createUsuarioSchema,
  CreateUsuarioDto
} from './dto/create-usuario.dto';

@Controller('usuarios')
@ApiTags('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createUsuarioSchema))
  @ApiOperation({ summary: 'Cadastra um usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['nome', 'email', 'idade', 'departamento'],
      properties: {
        nome: { type: 'string', minLength: 3, example: 'Ana Silva' },
        email: { type: 'string', format: 'email', example: 'ana@example.com' },
        idade: { type: 'integer', minimum: 18, maximum: 65, example: 30 },
        departamento: {
          type: 'string',
          enum: ['TI', 'RH', 'Vendas'],
          example: 'TI'
        }
      }
    }
  })
  @ApiCreatedResponse({ description: 'Usuário cadastrado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados enviados são inválidos' })
  @ApiConflictResponse({ description: 'Já existe um usuário com este e-mail' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.createOne(createUsuarioDto);
  }
}
