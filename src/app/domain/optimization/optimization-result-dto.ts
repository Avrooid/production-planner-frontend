// Основной интерфейс OptimizationResultDto
import {ProductionType} from "../team-productivity/production-type";
import {OptimizationRunDto} from "./optimization-run-dto";
import {ProductionSessionDto} from "../production-session/production-session-dto";
import {ProductDto} from "../products/product-dto";
import {TeamDto} from "../teams/team-dto";

export interface OptimizationResultDto {
  id: number;
  dayIndex: number;
  workDate: string;
  productionType: ProductionType;
  plannedHours: number;
  plannedQuantity: number;
  createdAt: string;
  optimizationRun: OptimizationRunDto;
  productionSession: ProductionSessionDto;
  team: TeamDto;
  product: ProductDto;
}
