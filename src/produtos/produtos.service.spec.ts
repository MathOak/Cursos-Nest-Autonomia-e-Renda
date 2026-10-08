import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProdutosService } from './produtos.service';
import { ProdutoEntity } from './schemas/produto.schema';

const produtoId = '507f1f77bcf86cd799439011';
const produtoRecord = {
  _id: new Types.ObjectId(produtoId),
  nome: 'notebook',
  categoria: 'eletronicos',
  preco: 3500,
  imagem: '/uploads/produtos/notebook.webp'
};

describe('ProdutosService', () => {
  let service: ProdutosService;
  let model: {
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    findByIdAndDelete: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutosService,
        { provide: getModelToken(ProdutoEntity.name), useValue: model }
      ]
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  const queryReturning = (value: unknown) => ({
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(value)
  });

  it('deveria estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deveria buscar produtos persistidos e mapear ObjectId para id', async () => {
    model.find.mockReturnValue(queryReturning([produtoRecord]));

    await expect(service.findAll()).resolves.toEqual([
      {
        id: produtoId,
        nome: 'notebook',
        categoria: 'eletronicos',
        preco: 3500,
        imagem: '/uploads/produtos/notebook.webp'
      }
    ]);
    expect(model.find).toHaveBeenCalledWith();
  });

  it('deveria buscar produto por id', async () => {
    model.findById.mockReturnValue(queryReturning(produtoRecord));

    await expect(service.findOne(produtoId)).resolves.toMatchObject({
      id: produtoId,
      nome: 'notebook'
    });
    expect(model.findById).toHaveBeenCalledWith(produtoId);
  });

  it('deveria rejeitar IDs inválidos sem consultar o banco', async () => {
    await expect(service.findOne('invalido')).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(model.findById).not.toHaveBeenCalled();
  });

  it('deveria retornar 404 quando o produto não existir', async () => {
    model.findById.mockReturnValue(queryReturning(null));

    await expect(service.findOne(produtoId)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('deveria filtrar produtos por categoria', async () => {
    model.find.mockReturnValue(queryReturning([produtoRecord]));

    await expect(
      service.findAllByCategory('eletronicos')
    ).resolves.toHaveLength(1);
    expect(model.find).toHaveBeenCalledWith({ categoria: 'eletronicos' });
  });

  it('deveria criar produto no model e retornar o documento criado', async () => {
    model.create.mockResolvedValue(produtoRecord);

    await expect(
      service.createOne({
        nome: 'notebook',
        categoria: 'eletronicos',
        preco: 3500
      })
    ).resolves.toEqual({
      id: produtoId,
      nome: 'notebook',
      categoria: 'eletronicos',
      preco: 3500,
      imagem: '/uploads/produtos/notebook.webp'
    });
    expect(model.create).toHaveBeenCalledWith({
      nome: 'notebook',
      categoria: 'eletronicos',
      preco: 3500
    });
  });

  it('deveria atualizar produto validando os campos do schema', async () => {
    model.findByIdAndUpdate.mockReturnValue(queryReturning(produtoRecord));

    await service.updateOne(produtoId, { preco: 3000 });

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      produtoId,
      { preco: 3000 },
      { new: true, runValidators: true }
    );
  });

  it('deveria atualizar parcialmente o produto', async () => {
    model.findByIdAndUpdate.mockReturnValue(queryReturning(produtoRecord));

    await service.updateOnePartial(produtoId, { imagem: null });

    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      produtoId,
      { imagem: null },
      { new: true, runValidators: true }
    );
  });

  it('deveria retornar 404 ao atualizar ou remover produto inexistente', async () => {
    model.findByIdAndUpdate.mockReturnValue(queryReturning(null));
    model.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null)
    });

    await expect(service.updateOne(produtoId, { preco: 1 })).rejects.toThrow(
      NotFoundException
    );
    await expect(
      service.updateOnePartial(produtoId, { preco: 1 })
    ).rejects.toThrow(NotFoundException);
    await expect(service.remove(produtoId)).rejects.toThrow(NotFoundException);
  });

  it('deveria remover produto pelo id', async () => {
    model.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(produtoRecord)
    });

    await expect(service.remove(produtoId)).resolves.toBeUndefined();
    expect(model.findByIdAndDelete).toHaveBeenCalledWith(produtoId);
  });

  it('deveria propagar falhas do banco quando não há conexão', async () => {
    const databaseError = new Error(
      'MongoDB indisponível: conexão não estabelecida'
    );
    const queryWithoutConnection = () => ({
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(databaseError)
    });

    model.find.mockReturnValue(queryWithoutConnection());
    model.findById.mockReturnValue(queryWithoutConnection());
    model.findByIdAndUpdate.mockReturnValue(queryWithoutConnection());
    model.findByIdAndDelete.mockReturnValue({
      exec: jest.fn().mockRejectedValue(databaseError)
    });
    model.create.mockRejectedValue(databaseError);

    await expect(service.findAll()).rejects.toBe(databaseError);
    await expect(service.findOne(produtoId)).rejects.toBe(databaseError);
    await expect(service.findAllByCategory('eletronicos')).rejects.toBe(
      databaseError
    );
    await expect(
      service.createOne({
        nome: 'notebook',
        categoria: 'eletronicos',
        preco: 3500
      })
    ).rejects.toBe(databaseError);
    await expect(service.updateOne(produtoId, { preco: 3000 })).rejects.toBe(
      databaseError
    );
    await expect(
      service.updateOnePartial(produtoId, { preco: 3000 })
    ).rejects.toBe(databaseError);
    await expect(service.remove(produtoId)).rejects.toBe(databaseError);
  });
});
