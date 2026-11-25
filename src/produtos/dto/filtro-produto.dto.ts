export class FiltroProdutoDto {
  categoria?: string;
  nome?: string;
  minPreco?: number;
  maxPreco?: number;
  page?: number;
  limit?: number;
  sortBy?: 'preco' | 'nome' | 'createdAt';
  order?: 'asc' | 'desc';
}
