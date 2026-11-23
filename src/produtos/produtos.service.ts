// produtos/produtos.services.ts
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto, ProdutoDocument } from './schema/produto.schema';
import { Error, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable() // Indica que esta classe é um provedor que pode ser injetado
export class ProdutosService {
  private readonly produtos: ProdutoDocument[] = [];

  constructor(
    @InjectModel('Produto') private readonly produtoModel: Model<Produto>
  ) {}

  findAll(): ProdutoDocument[] {
    return this.produtos;
  }

  findOne(id: string): Produto | undefined {
    return this.produtos.find((produto) => produto.id === id);
  }

  findAllByCategory(categoria: string): Produto[] {
    return this.produtos.filter((produto) => produto.categoria === categoria);
  }

  async createOne(
    createProdutoDTO: CreateProdutoDto
  ): Promise<ProdutoDocument> {
    try {
      return await this.produtoModel.create(createProdutoDTO);
    } catch (err: unknown) {
      const logger = new Logger();
      if (err instanceof Error) {
        logger.error(`Falha ao inserir produto: ${err.message}`);
        if (err.name === 'ValidationError')
          throw new BadRequestException(err.message);
        throw err;
      } else {
        // Pode ser algo que não é Error
        logger.error(`Erro desconhecido: ${String(err)}`);
        throw err;
      }
    }
  }

  updateOne(id: string, produtoDto: UpdateProdutoDto): Produto | undefined {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      return;
    }
    console.log(produtoDto);

    return this.produtos[produtoIndex];
  }

  updateOnePartial(
    id: string,
    produtoDtoPartial: Partial<UpdateProdutoDto>
  ): Produto | undefined {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      return;
    }
    console.log(produtoDtoPartial);

    return this.produtos[produtoIndex];
  }

  remove(id: string): void {
    const produtoIndex = this.produtos.findIndex(
      (produto) => produto.id === id
    );
    if (produtoIndex === -1) {
      return;
    }

    this.produtos.splice(produtoIndex, 1);
  }
}
