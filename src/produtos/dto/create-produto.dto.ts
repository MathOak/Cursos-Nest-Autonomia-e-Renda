import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProdutoDto {
  @ApiProperty({
    description: 'Nome que identifica o produto no catálogo',
    example: 'Arroz 5kg'
  })
  @IsString({ message: 'O nome do produto precisa ser um texto' })
  nome: string;

  @ApiProperty({
    description: 'Preço do produto em reais',
    example: 29.9
  })
  @IsNumber()
  preco: number;

  @ApiProperty({
    description: 'Categoria usada para organizar e filtrar produtos',
    example: 'alimentos'
  })
  @IsString({ message: 'A categoria do produto precisa ser um texto' })
  categoria: string;

  @ApiPropertyOptional({
    description: 'URL ou caminho da imagem do produto',
    example: '/uploads/produtos/arroz.webp',
    nullable: true
  })
  @IsOptional()
  @IsString({ message: 'A imagem do produto precisa ser um texto' })
  imagem?: string | null;
}
