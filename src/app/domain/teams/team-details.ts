import {TeamType} from "./team-type";

export interface TeamDetails {
  name: string;
  teamType: 'production' | 'assembly';
  employeeCount: number;
  monthlyHours: number;
  maxDailyHours: number;
  active: boolean;
}
