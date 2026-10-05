// produtos/produtos.services.ts
import {
  Injectable,
  //Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  imagem?: string | null;
};

@Injectable() // Indica que esta classe é um provedor que pode ser injetado
export class ProdutosService {
  private readonly produtos: Produto[] = [];

  constructor() {
    this.produtos.push({
      id: '1',
      nome: 'notebook',
      preco: 3500,
      categoria: 'eletronicos',
      imagem: '/api/uploads/produtos/notebook.jpg'
    });
    this.produtos.push({
      id: '2',
      nome: 'mouse',
      preco: 150,
      categoria: 'eletronicos',
      imagem: '/api/uploads/produtos/mouse.jpg'
    });
    this.produtos.push({
      id: '3',
      nome: 'teclado',
      preco: 250.55,
      categoria: 'eletronicos',
      imagem: '/api/uploads/produtos/teclado.jpg'
    });
    this.produtos.push({
      id: '4',
      nome: 'cadeira',
      preco: 250.55,
      categoria: 'moveis',
      imagem: '/api/uploads/produtos/cadeira.jpg'
    });
  }

  findAll(): Produto[] {
    return this.produtos;
  }

  findOne(id: string): Produto {
    const produto = this.produtos.find((item) => item.id === id);
    if (!produto) {
      //this.logger.warn(`Produto ${id} não encontrado`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return produto;
  }

  findAllByCategory(categoria: string): Produto[] {
    return this.produtos.filter((produto) => produto.categoria === categoria);
  }

  createOne(createProdutoDTO: CreateProdutoDto): Produto {
    const newId = (
      Math.max(...this.produtos.map((produto) => Number(produto.id)), 0) + 1
    ).toString();
    const newProduto: Produto = { id: newId, ...createProdutoDTO };
    this.produtos.push(newProduto);
    return newProduto;
  }

  updateOne(id: string, produtoDto: UpdateProdutoDto): Produto {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      //this.logger.warn(`Tentativa de atualizar produto inexistente: ${id}`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    this.produtos[produtoIndex] = {
      ...this.produtos[produtoIndex],
      ...produtoDto,
      id
    };

    return this.produtos[produtoIndex];
  }

  updateOnePartial(
    id: string,
    produtoDtoPartial: Partial<UpdateProdutoDto>
  ): Produto {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      // this.logger.warn(
      //   `Tentativa de atualizar parcialmente produto inexistente: ${id}`
      // );
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    this.produtos[produtoIndex] = {
      ...this.produtos[produtoIndex],
      ...produtoDtoPartial
    };

    return this.produtos[produtoIndex];
  }

  remove(id: string): void {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      //this.logger.warn(`Tentativa de remover produto inexistente: ${id}`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    this.produtos.splice(produtoIndex, 1);
  }
}
