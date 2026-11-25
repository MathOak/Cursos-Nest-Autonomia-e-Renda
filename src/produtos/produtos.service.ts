// produtos/produtos.services.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { Produto, ProdutoDocument } from './schema/produto.schema';
import { Error, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FiltroProdutoDto } from './dto/filtro-produto.dto';

@Injectable() // Indica que esta classe é um provedor que pode ser injetado
export class ProdutosService {
  private readonly produtos: ProdutoDocument[] = [];

  constructor(
    @InjectModel('Produto') private readonly produtoModel: Model<Produto>
  ) {}

  async findAll(query: FiltroProdutoDto): Promise<ProdutoDocument[]> {
    const {
      categoria,
      nome,
      minPreco,
      maxPreco,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = query;
    const filtro: {
      ativo?: boolean;
      categoria?: string;
      nome?: { $regex: string; $options: 'i' };
      preco?: {
        $gte?: number;
        $lte?: number;
      };
    } = {
      ativo: true
    };
    if (categoria) filtro.categoria = categoria;
    if (nome) filtro.nome = { $regex: nome, $options: 'i' };
    if (minPreco || maxPreco) {
      filtro.preco = {
        ...(minPreco && { $gte: Number(minPreco) }),
        ...(maxPreco && { $lte: Number(maxPreco) })
      };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const [itens] = await Promise.all([
      this.produtoModel
        .find(filtro)
        .select('-__v')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .exec(),
      this.produtoModel.countDocuments(filtro)
    ]);
    return itens;
  }

  async findOne(id: string): Promise<ProdutoDocument | undefined> {
    const produto = await this.produtoModel
      .findById(id)
      .select('-__v -ativo -_id -createdAt -updatedAt')
      .exec();
    if (!produto) throw new NotFoundException('Produto não encotnrado');

    return produto;
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
