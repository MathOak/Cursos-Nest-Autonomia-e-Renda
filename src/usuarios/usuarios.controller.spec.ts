import { Test, TestingModule } from '@nestjs/testing';
import { CreateUsuarioDto } from './schemas/create-usuario.schema';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

describe('UsuariosController', () => {
  let controller: UsuariosController;
  let usuariosService: { createOne: jest.Mock };

  beforeEach(async () => {
    usuariosService = { createOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [{ provide: UsuariosService, useValue: usuariosService }]
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
  });

  it('deveria estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deveria encaminhar os dados validados ao serviço e retornar o usuário criado', () => {
    const dto: CreateUsuarioDto = {
      nome: 'Ana Silva',
      email: 'ana@example.com',
      idade: 30,
      departamento: 'TI'
    };
    const usuarioCriado = { id: '1', ...dto };
    usuariosService.createOne.mockReturnValue(usuarioCriado);

    expect(controller.create(dto)).toBe(usuarioCriado);
    expect(usuariosService.createOne).toHaveBeenCalledWith(dto);
    expect(usuariosService.createOne).toHaveBeenCalledTimes(1);
  });
});
