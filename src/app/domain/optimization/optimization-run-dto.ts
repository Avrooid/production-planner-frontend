import {ProductionSessionDto} from "../production-session/production-session-dto";

export interface OptimizationRunDto {
  id: number;
  runTimestamp: string;
  modelVersion: string;
  kTardyDefault: number;
  kUnder: number;
  kOver: number;
  alpha: number;
  beta: number;
  deltaBuffer: number;
  comment: string;
  productionSession: ProductionSessionDto;
}
