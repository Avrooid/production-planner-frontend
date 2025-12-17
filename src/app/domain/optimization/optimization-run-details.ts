export interface OptimizationRunDetails {
  runTimestamp: string; // или Date для удобства работы
  modelVersion: string;
  kTardyDefault: number; // или string если нужно точное представление BigDecimal
  kUnder: number;
  kOver: number;
  alpha: number;
  beta: number;
  deltaBuffer: number;
  comment: string;
  productionSessionId: number;
}
