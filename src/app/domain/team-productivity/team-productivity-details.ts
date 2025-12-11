import {ProductionType} from "./production-type";

export interface TeamProductivityDetails {
  teamId: number;
  productId: number;
  productionType: string;
  qualification: number;
  productivity: number;
}
