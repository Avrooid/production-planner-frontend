import {ProductionSessionDto} from "../production-session/production-session-dto";

export interface OptimizationRunDto {
  id: number;
  runTimestamp: string;
  modelVersion: string;
  tardyDefaultK: number;
  underK: number;
  overK: number;
  alpha: number;
  beta: number;
  deltaBuffer: number;
  comment: string;
  productionSession: ProductionSessionDto;
}
