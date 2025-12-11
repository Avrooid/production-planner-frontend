import {ProductDto} from "../products/product-dto";

export interface SessionOrderDto {
  id: number;
  product: ProductDto;
  quantity: number;
  productionType: string;
  deadlineDate: string | Date;
  source: string;
  createdAt: string | Date;
}
