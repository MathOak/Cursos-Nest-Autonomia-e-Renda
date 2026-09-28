import { Test, TestingModule } from '@nestjs/testing';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { ProdutosController } from './produtos.controller';
import { Produto, ProdutosService } from './produtos.service';

describe('ProdutosController', () => {
  let controller: ProdutosController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    findAllByCategory: jest.Mock;
    createOne: jest.Mock;
    updateOne: jest.Mock;
    updateOnePartial: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findAllByCategory: jest.fn(),
      createOne: jest.fn(),
      updateOne: jest.fn(),
      updateOnePartial: jest.fn(),
      remove: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProdutosController],
      providers: [{ provide: ProdutosService, useValue: service }]
    }).compile();

    controller = module.get<ProdutosController>(ProdutosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('deveria buscar todos os produtos', () => {
    const produtos = [{ id: '1', nome: 'notebook' }];
    service.findAll.mockReturnValue(produtos);

    expect(controller.findAll()).toBe(produtos);
    expect(service.findAll).toHaveBeenCalledTimes(1);
  });

  it('deveria buscar um produto pelo id', () => {
    const produto = { id: '1', nome: 'notebook' };
    service.findOne.mockReturnValue(produto);

    expect(controller.findOne('1')).toBe(produto);
    expect(service.findOne).toHaveBeenCalledWith('1');
  });

  it('deveria filtrar produtos por categoria', () => {
    const produtos = [{ id: '1', nome: 'notebook' }];
    service.findAllByCategory.mockReturnValue(produtos);

    expect(controller.filterByCategory('eletronicos')).toBe(produtos);
    expect(service.findAllByCategory).toHaveBeenCalledWith('eletronicos');
  });

  it('deveria criar um produto', () => {
    const produtoDto = {
      nome: 'monitor',
      preco: 1200,
      categoria: 'eletronicos'
    };
    const produtoCriado = { id: '5', ...produtoDto };
    service.createOne.mockReturnValue(produtoCriado);

    expect(controller.create(produtoDto)).toBe(produtoCriado);
    expect(service.createOne).toHaveBeenCalledWith(produtoDto);
  });

  it('deveria atualizar um produto completamente', () => {
    const produtoDto = {
      nome: 'monitor ultrawide',
      preco: 1800,
      categoria: 'eletronicos'
    };
    const produtoAtualizado = { id: '1', ...produtoDto };
    service.updateOne.mockReturnValue(produtoAtualizado);

    expect(controller.update('1', produtoDto)).toBe(produtoAtualizado);
    expect(service.updateOne).toHaveBeenCalledWith('1', produtoDto);
  });

  it('deveria atualizar parcialmente um produto', () => {
    const produtoDto = { preco: 1750 };
    const produtoAtualizado = {
      id: '1',
      nome: 'notebook',
      preco: 1750,
      categoria: 'eletronicos'
    };
    service.updateOnePartial.mockReturnValue(produtoAtualizado);

    expect(controller.updatePartial('1', produtoDto)).toBe(produtoAtualizado);
    expect(service.updateOnePartial).toHaveBeenCalledWith('1', produtoDto);
  });

  it('deveria remover um produto', () => {
    controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith('1');
  });

  it('deveria processar uma imagem padrão e salvar em WebP', async () => {
    const diretorioTemporario = join(tmpdir(), `produtos-${Date.now()}`);
    const arquivoOrigem = join(diretorioTemporario, 'origem.png');

    mkdirSync(diretorioTemporario, { recursive: true });
    await sharp({
      create: {
        width: 1600,
        height: 1200,
        channels: 3,
        background: { r: 30, g: 120, b: 220 }
      }
    })
      .png()
      .toFile(arquivoOrigem);

    service.findOne.mockReturnValue({ id: '1', imagem: null });
    service.updateOnePartial.mockImplementation(
      (_id, produto) => produto as Produto
    );

    const resultado = await controller.uploadImagem('1', {
      path: arquivoOrigem
    } as Express.Multer.File);

    expect(resultado).toEqual({
      imagem: expect.stringMatching(/\.webp$/) as string
    });
    expect(service.updateOnePartial).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        imagem: expect.stringMatching(/\.webp$/) as string
      })
    );

    const imagemUrl = (resultado as { imagem: string }).imagem;
    const arquivoProcessado = join(process.cwd(), imagemUrl.replace(/^\//, ''));
    const metadados = await sharp(arquivoProcessado).metadata();

    expect(metadados.format).toBe('webp');
    expect(metadados.width).toBe(800);
    expect(metadados.height).toBe(600);

    rmSync(diretorioTemporario, { recursive: true, force: true });
    rmSync(arquivoProcessado, { force: true });
  });

  it('deveria remover a imagem antiga ao substituir a imagem do produto', async () => {
    const diretorioUpload = join(process.cwd(), 'uploads', 'produtos');
    const diretorioTemporario = join(tmpdir(), `produtos-${Date.now()}`);
    const arquivoOrigem = join(diretorioTemporario, 'origem.png');
    const arquivoAntigo = join(diretorioUpload, 'imagem-antiga.webp');

    mkdirSync(diretorioTemporario, { recursive: true });
    mkdirSync(diretorioUpload, { recursive: true });
    writeFileSync(arquivoAntigo, 'imagem antiga');
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 220, g: 80, b: 40 }
      }
    })
      .png()
      .toFile(arquivoOrigem);

    service.findOne.mockReturnValue({
      id: '1',
      imagem: '/uploads/produtos/imagem-antiga.webp'
    });
    service.updateOnePartial.mockReturnValue({ id: '1', imagem: 'nova' });

    await controller.uploadImagem('1', {
      path: arquivoOrigem
    } as Express.Multer.File);

    expect(existsSync(arquivoAntigo)).toBe(false);

    rmSync(diretorioTemporario, { recursive: true, force: true });
  });

  it('deveria apagar a imagem do disco e limpar sua URL no produto', () => {
    const diretorioUpload = join(process.cwd(), 'uploads', 'produtos');
    const arquivoImagem = join(diretorioUpload, 'imagem-para-apagar.webp');

    mkdirSync(diretorioUpload, { recursive: true });
    writeFileSync(arquivoImagem, 'imagem');
    service.findOne.mockReturnValue({
      id: '1',
      imagem: '/uploads/produtos/imagem-para-apagar.webp'
    });

    controller.removeImagem('1');

    expect(existsSync(arquivoImagem)).toBe(false);
    expect(service.updateOnePartial).toHaveBeenCalledWith('1', {
      imagem: null
    });
  });
});
