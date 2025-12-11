import {TeamType} from "./team-type";

export interface TeamDto {
  id: number;
  name: string;
  teamType: 'PRODUCTION' | 'ASSEMBLY';
  employeeCount: number;
  monthlyHours: number;
  maxDailyHours: number;
  active: boolean;
  createdAt: string;
}
