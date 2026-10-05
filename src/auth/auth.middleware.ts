// src/auth/auth.middleware.ts
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn(
        `Acesso negado: ${req.method} ${req.originalUrl} (token ausente ou esquema inválido)`
      );
      return res.status(401).json({
        statusCode: 401,
        message: 'Token de autenticação ausente ou inválido',
        error: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      this.logger.warn(
        `Acesso negado: ${req.method} ${req.originalUrl} (token Bearer vazio)`
      );
      return res.status(401).json({
        statusCode: 401,
        message: 'Token de autenticação ausente ou inválido',
        error: 'Unauthorized'
      });
    }

    // Lógica de validação do token aqui. Nunca registrar o token nos logs.
    next();
  }
}
