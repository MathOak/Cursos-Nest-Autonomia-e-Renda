import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuarioEntity } from './schemas/usuario.schema';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let usuarioModel: { create: jest.Mock };

  beforeEach(async () => {
    usuarioModel = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getModelToken(UsuarioEntity.name), useValue: usuarioModel }
      ]
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('deveria persistir e retornar o usuário criado com id MongoDB', async () => {
    const id = '507f1f77bcf86cd799439011';
    usuarioModel.create.mockResolvedValue({
      _id: { toString: () => id },
      nome: 'Ana Silva',
      email: 'ana@example.com',
      idade: 30,
      departamento: 'TI'
    });

    const dto = {
      nome: 'Ana Silva',
      email: 'ana@example.com',
      idade: 30,
      departamento: 'TI' as const
    };

    await expect(service.createOne(dto)).resolves.toEqual({ id, ...dto });
    expect(usuarioModel.create).toHaveBeenCalledWith(dto);
  });

  it('deveria converter e-mail duplicado em conflito HTTP', async () => {
    usuarioModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.createOne({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        idade: 30,
        departamento: 'TI'
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deveria propagar falha quando o banco não está conectado', async () => {
    const databaseError = new Error(
      'MongoDB indisponível: conexão não estabelecida'
    );
    usuarioModel.create.mockRejectedValue(databaseError);

    await expect(
      service.createOne({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        idade: 30,
        departamento: 'TI'
      })
    ).rejects.toBe(databaseError);
  });
});
