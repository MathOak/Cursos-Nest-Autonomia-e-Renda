import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProdutoDto {
  @IsString({ message: 'O nome do produto precisa ser um texto' })
  nome!: string;

  @IsNumber()
  preco!: number;

  @IsString({ message: 'A categoria do produto precisa ser um texto' })
  categoria!: string;

  @IsOptional()
  @IsString({ message: 'A imagem do produto precisa ser um texto' })
  imagem?: string;

  @IsString({ message: 'O Codigo precisa ser string' })
  codigo!: string;
  @IsNumber()
  @Min(0)
  estoque!: number;
}
