import { BadRequestException } from '@nestjs/common';
import { createUsuarioSchema } from '../../usuarios/dto/create-usuario.dto';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(createUsuarioSchema);
  const usuario = {
    nome: 'Ana Silva',
    email: 'ana@example.com',
    idade: 30,
    departamento: 'TI'
  };

  const casosInvalidos: Array<{ payload: unknown; campo: string }> = [
    { payload: { ...usuario, nome: 'Al' }, campo: 'nome' },
    { payload: { ...usuario, nome: 42 }, campo: 'nome' },
    { payload: { ...usuario, email: undefined }, campo: 'email' },
    { payload: { ...usuario, email: 'nao-e-email' }, campo: 'email' },
    { payload: { ...usuario, idade: '30' }, campo: 'idade' },
    { payload: { ...usuario, idade: 17 }, campo: 'idade' },
    { payload: { ...usuario, idade: 70 }, campo: 'idade' },
    { payload: { ...usuario, idade: 30.5 }, campo: 'idade' },
    {
      payload: { ...usuario, departamento: 'Marketing' },
      campo: 'departamento'
    },
    {
      payload: {
        nome: usuario.nome,
        email: usuario.email,
        idade: usuario.idade
      },
      campo: 'departamento'
    }
  ];

  it('deveria aceitar dados válidos e retornar os dados validados', () => {
    expect(pipe.transform(usuario)).toEqual(usuario);
  });

  it.each(casosInvalidos)(
    'deveria rejeitar dados inválidos no campo $campo',
    ({ payload, campo }) => {
      let exception: unknown;

      try {
        pipe.transform(payload);
      } catch (error: unknown) {
        exception = error;
      }

      expect(exception).toBeInstanceOf(BadRequestException);
      if (!(exception instanceof BadRequestException)) {
        return;
      }

      const response = exception.getResponse();
      expect(typeof response).toBe('object');
      if (typeof response !== 'object' || response === null) {
        return;
      }

      expect('message' in response ? response.message : undefined).toBe(
        'Os dados enviados são inválidos'
      );
      const errors = 'errors' in response ? response.errors : undefined;
      expect(Array.isArray(errors)).toBe(true);
      if (!Array.isArray(errors)) {
        return;
      }

      const fieldIssue = errors.find(
        (issue: unknown): issue is { field: string } =>
          typeof issue === 'object' &&
          issue !== null &&
          'field' in issue &&
          typeof issue.field === 'string' &&
          issue.field === campo
      );
      expect(fieldIssue).toBeDefined();
    }
  );
});
