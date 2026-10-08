// produtos/produtos.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import sharp from 'sharp';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Produto, ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';

const ensureUploadDir = (): string => {
  const uploadDir = join(process.cwd(), 'uploads', 'produtos');
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const deleteFileIfExists = (filePath?: string | null): void => {
  if (!filePath) {
    return;
  }

  const absolutePath = join(process.cwd(), filePath.replace(/^\//, ''));
  if (existsSync(absolutePath)) {
    unlinkSync(absolutePath);
  }
};

const cleanupUploadedFile = (filePath: string): void => {
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
};

@Controller('produtos')
@ApiTags('produtos')
@ApiBearerAuth()
export class ProdutosController {
  private readonly logger = new Logger(ProdutosController.name);

  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos' })
  @ApiOkResponse({ description: 'Lista de produtos retornada com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async findAll() {
    return this.produtosService.findAll();
  }

  @Get('filtrar')
  @ApiOperation({ summary: 'Filtra produtos por categoria' })
  @ApiQuery({
    name: 'categoria',
    description: 'Categoria dos produtos desejados',
    example: 'eletronicos'
  })
  @ApiOkResponse({
    description: 'Produtos da categoria retornados com sucesso'
  })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async filterByCategory(@Query('categoria') categoria: string) {
    this.logger.log(`Filtrando produtos pela categoria "${categoria}"`);
    return this.produtosService.findAllByCategory(categoria);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um produto pelo identificador' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiOkResponse({ description: 'Produto encontrado' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async findOne(@Param('id') id: string) {
    return this.produtosService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um produto no catálogo' })
  @ApiCreatedResponse({ description: 'Produto criado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados enviados são inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.createOne(createProdutoDto);
  }

  // Fluxo padrão: arquivos até 5MB. Limite pequeno para evitar peso excessivo.
  @Post(':id/imagem')
  @ApiOperation({ summary: 'Envia uma imagem de produto de até 5 MB' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } }
    }
  })
  @ApiOkResponse({
    description: 'Imagem convertida para WebP e associada ao produto'
  })
  @ApiBadRequestResponse({
    description: 'Arquivo ausente, inválido ou maior que 5 MB'
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  @UseInterceptors(
    FileInterceptor('imagem', {
      limits: {
        fileSize: 5 * 1024 * 1024
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = ensureUploadDir();
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const extension = extname(file.originalname);
          cb(null, `${uniqueName}${extension}`);
        }
      }),
      fileFilter: (_req, file, cb) => {
        // Aceita somente imagens para evitar upload de arquivos que não são fotos.
        const formatosAceitos = /image\/(jpg|jpeg|png|gif|webp)/;
        if (!formatosAceitos.test(file.mimetype)) {
          cb(new BadRequestException('Formato de imagem inválido'), false);
          return;
        }
        cb(null, true);
      }
    })
  )
  async uploadImagem(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      this.logger.warn(
        `Upload de imagem rejeitado para o produto ${id}: arquivo ausente`
      );
      throw new BadRequestException('O arquivo de imagem é obrigatório');
    }

    let produtoExistente: Produto;
    try {
      produtoExistente = await this.produtosService.findOne(id);
    } catch (error) {
      cleanupUploadedFile(file.path);
      this.logger.warn(
        `Upload de imagem cancelado: produto ${id} não encontrado`
      );
      throw error;
    }

    const uploadDir = ensureUploadDir();
    const nomeArquivo = `${Date.now()}-${Math.random().toString(16).slice(2)}.webp`;
    const caminhoArquivo = join(uploadDir, nomeArquivo);

    try {
      // O Sharp redimensiona e converte para WebP para reduzir o tamanho da imagem.
      await sharp(file.path)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 80 })
        .toFile(caminhoArquivo);
    } catch {
      cleanupUploadedFile(caminhoArquivo);
      this.logger.warn(`Imagem inválida recebida para o produto ${id}`);
      throw new BadRequestException(
        'O arquivo enviado não é uma imagem válida'
      );
    } finally {
      cleanupUploadedFile(file.path);
    }

    deleteFileIfExists(produtoExistente.imagem);
    const imagemUrl = `/uploads/produtos/${nomeArquivo}`;
    this.logger.log(`Imagem do produto ${id} processada e armazenada`);
    return this.produtosService.updateOnePartial(id, { imagem: imagemUrl });
  }

  // Fluxo específico para imagens maiores, com limite mais alto e ajuste de qualidade.
  @Post(':id/imagem-grande')
  @ApiOperation({ summary: 'Envia uma imagem de produto de até 20 MB' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['imagem'],
      properties: { imagem: { type: 'string', format: 'binary' } }
    }
  })
  @ApiOkResponse({
    description: 'Imagem convertida para WebP e associada ao produto'
  })
  @ApiBadRequestResponse({
    description: 'Arquivo ausente, inválido ou maior que 20 MB'
  })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  @UseInterceptors(
    FileInterceptor('imagem', {
      limits: {
        fileSize: 20 * 1024 * 1024
      },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = ensureUploadDir();
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
          const extension = extname(file.originalname);
          cb(null, `${uniqueName}${extension}`);
        }
      }),
      fileFilter: (_req, file, cb) => {
        const formatosAceitos = /image\/(jpg|jpeg|png|gif|webp)/;
        if (!formatosAceitos.test(file.mimetype)) {
          cb(new BadRequestException('Formato de imagem inválido'), false);
          return;
        }
        cb(null, true);
      }
    })
  )
  async uploadImagemGrande(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      this.logger.warn(
        `Upload de imagem grande rejeitado para o produto ${id}: arquivo ausente`
      );
      throw new BadRequestException('O arquivo de imagem é obrigatório');
    }

    let produtoExistente: Produto;
    try {
      produtoExistente = await this.produtosService.findOne(id);
    } catch (error) {
      cleanupUploadedFile(file.path);
      this.logger.warn(
        `Upload de imagem grande cancelado: produto ${id} não encontrado`
      );
      throw error;
    }

    const uploadDir = ensureUploadDir();
    const nomeArquivo = `${Date.now()}-${Math.random().toString(16).slice(2)}.webp`;
    const caminhoArquivo = join(uploadDir, nomeArquivo);

    try {
      await sharp(file.path)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 75 })
        .toFile(caminhoArquivo);
    } catch {
      cleanupUploadedFile(caminhoArquivo);
      this.logger.warn(`Imagem grande inválida recebida para o produto ${id}`);
      throw new BadRequestException(
        'O arquivo enviado não é uma imagem válida'
      );
    } finally {
      cleanupUploadedFile(file.path);
    }

    deleteFileIfExists(produtoExistente.imagem);
    const imagemUrl = `/uploads/produtos/${nomeArquivo}`;
    this.logger.log(`Imagem grande do produto ${id} processada e armazenada`);
    return this.produtosService.updateOnePartial(id, { imagem: imagemUrl });
  }

  // Remove a imagem do produto e apaga o arquivo físico do disco.
  @Delete(':id/imagem')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a imagem de um produto' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiNoContentResponse({ description: 'Imagem removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async removeImagem(@Param('id') id: string): Promise<void> {
    const produto = await this.produtosService.findOne(id);
    deleteFileIfExists(produto.imagem);
    await this.produtosService.updateOnePartial(id, { imagem: null });
    this.logger.log(`Imagem removida do produto ${id}`);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um produto' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiOkResponse({ description: 'Produto atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados enviados são inválidos' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.produtosService.updateOne(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente os dados de um produto' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiOkResponse({ description: 'Produto atualizado com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados enviados são inválidos' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async updatePartial(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateProdutoDto>
  ) {
    return this.produtosService.updateOnePartial(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove um produto do catálogo' })
  @ApiParam({
    name: 'id',
    description: 'Identificador do produto',
    example: '1'
  })
  @ApiNoContentResponse({ description: 'Produto removido com sucesso' })
  @ApiNotFoundResponse({ description: 'Produto não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token Bearer ausente ou inválido' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.produtosService.remove(id);
    this.logger.log(`Produto ${id} removido`);
  }
}
