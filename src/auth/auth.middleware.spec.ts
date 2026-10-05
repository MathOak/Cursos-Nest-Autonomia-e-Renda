import type { NextFunction, Request, Response } from 'express';
import { AuthMiddleware } from './auth.middleware';

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let request: Partial<Request>;
  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    middleware = new AuthMiddleware();
    request = {
      method: 'GET',
      url: '/api/produtos',
      headers: {}
    };
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('retorna 401 quando o header Authorization está ausente', () => {
    middleware.use(request as Request, response as unknown as Response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token de autenticação ausente ou inválido',
      error: 'Unauthorized'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 quando o header não usa o esquema Bearer', () => {
    request.headers = { authorization: 'Basic credenciais' };

    middleware.use(request as Request, response as unknown as Response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token de autenticação ausente ou inválido',
      error: 'Unauthorized'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('continua o fluxo quando recebe um token no formato Bearer', () => {
    request.headers = { authorization: 'Bearer token-de-teste' };

    middleware.use(request as Request, response as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('retorna 401 quando o esquema Bearer não contém token', () => {
    request.headers = { authorization: 'Bearer ' };

    middleware.use(request as Request, response as unknown as Response, next);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token de autenticação ausente ou inválido',
      error: 'Unauthorized'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
