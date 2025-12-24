import {ProductDto} from "../products/product-dto";

export interface OrderWork {
  product: ProductDto;
  plannedHours: number;
  plannedQuantity: number;
  workDate: string;
  productionType: string;
  dayIndex: number;
}
