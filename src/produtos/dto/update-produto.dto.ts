import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProdutoDto {
  @ApiPropertyOptional({ description: 'Novo nome do produto', example: 'Arroz 5kg' })
  @IsOptional()
  @IsString({ message: 'O nome do produto precisa ser um texto' })
  nome?: string;

  @ApiPropertyOptional({
    description: 'Novo preço do produto em reais',
    example: 29.9
  })
  @IsOptional()
  @IsNumber()
  preco?: number;

  @ApiPropertyOptional({ description: 'Nova categoria do produto', example: 'alimentos' })
  @IsOptional()
  @IsString({ message: 'A categoria do produto precisa ser um texto' })
  categoria?: string;

  @ApiPropertyOptional({
    description: 'Nova URL ou caminho da imagem do produto',
    example: '/uploads/produtos/arroz.webp',
    nullable: true
  })
  @IsOptional()
  @IsString({ message: 'A imagem do produto precisa ser um texto' })
  imagem?: string | null;
}
