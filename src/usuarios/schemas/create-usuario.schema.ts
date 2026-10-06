// src\usuarios\schemas\create-usuario.schema.ts
import { z } from 'zod';

export const createUsuarioSchema = z.object({
  nome: z
    .string({ error: 'O nome precisa ser um texto' })
    .trim()
    .min(3, { error: 'O nome deve ter no mínimo 3 caracteres' }),
  email: z.email({ error: 'Informe um e-mail válido' }),
  idade: z
    .number({ error: 'A idade precisa ser um número' })
    .int({ error: 'A idade precisa ser um número inteiro' })
    .min(18, { error: 'A idade mínima é 18 anos' })
    .max(65, { error: 'A idade máxima é 65 anos' }),
  departamento: z.enum(['TI', 'RH', 'Vendas'], {
    error: 'O departamento deve ser TI, RH ou Vendas'
  })
});

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
