import {SessionOrderDto} from "./session-order-dto";

export interface ProductionSessionDto {
  id: number;
  name: string;
  startDate: string | Date;
  endDate: string | Date | null;
  status: string;
  createdAt: string | Date;
  sessionOrders: SessionOrderDto[];
}
