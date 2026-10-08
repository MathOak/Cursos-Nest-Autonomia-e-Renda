// produtos/produtos.services.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { ProdutoEntity } from './schemas/produto.schema';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  imagem?: string | null;
}

type ProdutoRecord = ProdutoEntity & { _id: Types.ObjectId };

@Injectable()
export class ProdutosService {
  private readonly logger = new Logger(ProdutosService.name);

  constructor(
    @InjectModel(ProdutoEntity.name)
    private readonly produtoModel: Model<ProdutoEntity>
  ) {}

  private toResponse(produto: ProdutoRecord): Produto {
    return {
      id: produto._id.toString(),
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco,
      imagem: produto.imagem
    };
  }

  private ensureValidId(id: string): void {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
  }

  async findAll(): Promise<Produto[]> {
    const produtos = await this.produtoModel.find().lean().exec();
    return produtos.map((produto) => this.toResponse(produto as ProdutoRecord));
  }

  async findOne(id: string): Promise<Produto> {
    this.ensureValidId(id);
    const produto = await this.produtoModel.findById(id).lean().exec();
    if (!produto) {
      this.logger.warn(`Produto ${id} não encontrado`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return this.toResponse(produto);
  }

  async findAllByCategory(categoria: string): Promise<Produto[]> {
    const produtos = await this.produtoModel.find({ categoria }).lean().exec();
    return produtos.map((produto) => this.toResponse(produto as ProdutoRecord));
  }

  async createOne(createProdutoDto: CreateProdutoDto): Promise<Produto> {
    const produto = await this.produtoModel.create(createProdutoDto);
    this.logger.log(`Produto ${produto._id.toString()} criado`);
    return this.toResponse(produto);
  }

  async updateOne(id: string, produtoDto: UpdateProdutoDto): Promise<Produto> {
    this.ensureValidId(id);
    const produto = await this.produtoModel
      .findByIdAndUpdate(id, produtoDto, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!produto) {
      this.logger.warn(`Tentativa de atualizar produto inexistente: ${id}`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return this.toResponse(produto);
  }

  async updateOnePartial(
    id: string,
    produtoDtoPartial: Partial<UpdateProdutoDto>
  ): Promise<Produto> {
    this.ensureValidId(id);
    const produto = await this.produtoModel
      .findByIdAndUpdate(id, produtoDtoPartial, {
        new: true,
        runValidators: true
      })
      .lean()
      .exec();
    if (!produto) {
      this.logger.warn(
        `Tentativa de atualizar parcialmente produto inexistente: ${id}`
      );
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return this.toResponse(produto);
  }

  async remove(id: string): Promise<void> {
    this.ensureValidId(id);
    const produto = await this.produtoModel.findByIdAndDelete(id).exec();
    if (!produto) {
      this.logger.warn(`Tentativa de remover produto inexistente: ${id}`);
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }

    this.logger.log(`Produto ${id} removido do catálogo`);
  }
}
