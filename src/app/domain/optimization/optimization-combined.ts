import {SessionOrderDto} from "../production-session/session-order-dto";
import {TeamDayWork} from "./team-day-work";

export interface OptimizationCombined {
  sessionOrders: SessionOrderDto[];
  teamsDayWork: TeamDayWork[];
  workDate: string;
  totalQuantity: number;
  totalHours: number;
}
