import {ProductionType} from "./production-type";
import {ProductDto} from "../products/product-dto";
import {TeamDto} from "../teams/team-dto";

export interface TeamProductivityDto {
  id: number;
  team: TeamDto;
  product: ProductDto;
  productionType: ProductionType;
  qualification: number;
  productivity: number;
  active: boolean;
  createdAt: string;
}
