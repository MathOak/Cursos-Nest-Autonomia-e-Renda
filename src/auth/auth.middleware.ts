// src/auth/auth.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[AUTH] Requisição bloqueada: ${req.method} ${req.url}`);
      return res.status(401).json({
        statusCode: 401,
        message: 'Token de autenticação ausente ou inválido',
        error: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log(`[AUTH] Token recebido: ${token.substring(0, 10)}...`);
      return res.status(401).json({
        statusCode: 401,
        message: 'Token de autenticação ausente ou inválido',
        error: 'Unauthorized'
      });
    }

    // Lógica de validação do token aqui
    next();
  }
}
