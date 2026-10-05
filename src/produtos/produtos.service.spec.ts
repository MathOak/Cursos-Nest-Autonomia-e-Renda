import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProdutosService } from './produtos.service';

describe('ProdutosService', () => {
  let service: ProdutosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProdutosService]
    }).compile();

    service = module.get<ProdutosService>(ProdutosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deveria retornar todos os produtos', () => {
    expect(service.findAll()).toHaveLength(4);
    expect(service.findAll()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: '1', nome: 'notebook' }),
        expect.objectContaining({ id: '4', nome: 'cadeira' })
      ])
    );
  });

  it('deveria retornar um produto pelo id', () => {
    expect(service.findOne('2')).toEqual({
      id: '2',
      nome: 'mouse',
      preco: 150,
      categoria: 'eletronicos',
      imagem: '/api/uploads/produtos/mouse.jpg'
    });
  });

  it('deveria retornar 404 quando o id nao existir', () => {
    expect(() => service.findOne('999')).toThrow(NotFoundException);
  });

  it('deveria retornar produtos da categoria informada', () => {
    expect(service.findAllByCategory('moveis')).toEqual([
      {
        id: '4',
        nome: 'cadeira',
        preco: 250.55,
        categoria: 'moveis',
        imagem: '/api/uploads/produtos/cadeira.jpg'
      }
    ]);
  });

  it('deveria retornar uma lista vazia para categoria inexistente', () => {
    expect(service.findAllByCategory('livros')).toEqual([]);
  });

  it('deveria criar e retornar um novo produto', () => {
    const produtoDto = {
      nome: 'monitor',
      preco: 1200,
      categoria: 'eletronicos'
    };

    expect(service.createOne(produtoDto)).toEqual({
      id: '5',
      ...produtoDto
    });
    expect(service.findAll()).toHaveLength(5);
  });

  it('deveria substituir todos os campos no PUT', () => {
    const produtoAtualizado = service.updateOne('1', {
      nome: 'notebook gamer',
      preco: 5000,
      categoria: 'computadores'
    });

    expect(produtoAtualizado).toEqual({
      id: '1',
      nome: 'notebook gamer',
      preco: 5000,
      categoria: 'computadores',
      imagem: '/api/uploads/produtos/notebook.jpg'
    });
  });

  it('deveria preservar campos omitidos no PATCH', () => {
    const produtoAtualizado = service.updateOnePartial('2', { preco: 175 });

    expect(produtoAtualizado).toEqual({
      id: '2',
      nome: 'mouse',
      preco: 175,
      categoria: 'eletronicos',
      imagem: '/api/uploads/produtos/mouse.jpg'
    });
  });

  it('deveria remover um produto e manter o próximo ID disponível', () => {
    service.remove('2');

    expect(() => service.findOne('2')).toThrow(NotFoundException);
    expect(
      service.createOne({
        nome: 'webcam',
        preco: 300,
        categoria: 'eletronicos'
      })
    ).toEqual({
      id: '5',
      nome: 'webcam',
      preco: 300,
      categoria: 'eletronicos'
    });
  });

  it('deveria retornar 404 em atualização e remoção de produto inexistente', () => {
    expect(() =>
      service.updateOne('999', {
        nome: 'inexistente',
        preco: 1,
        categoria: 'teste'
      })
    ).toThrow(NotFoundException);
    expect(() => service.updateOnePartial('999', { preco: 10 })).toThrow(
      NotFoundException
    );
    expect(() => service.remove('999')).toThrow(NotFoundException);
  });
});
