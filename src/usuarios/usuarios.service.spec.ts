import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuariosService]
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('deveria cadastrar um usuário e gerar seu ID', () => {
    expect(
      service.createOne({
        nome: 'Ana Silva',
        email: 'ana@example.com',
        idade: 30,
        departamento: 'TI'
      })
    ).toEqual({
      id: '1',
      nome: 'Ana Silva',
      email: 'ana@example.com',
      idade: 30,
      departamento: 'TI'
    });
  });

  it('deveria gerar IDs sequenciais para usuários cadastrados', () => {
    const primeiroUsuario = service.createOne({
      nome: 'Ana Silva',
      email: 'ana@example.com',
      idade: 30,
      departamento: 'TI'
    });
    const segundoUsuario = service.createOne({
      nome: 'João Souza',
      email: 'joao@example.com',
      idade: 42,
      departamento: 'RH'
    });

    expect(primeiroUsuario.id).toBe('1');
    expect(segundoUsuario.id).toBe('2');
  });
});
