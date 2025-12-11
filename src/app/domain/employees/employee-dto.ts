import {TeamDto} from "../teams/team-dto";

export interface EmployeeDto {
  id: number;
  fullName: string;
  team: TeamDto;
  position: string;
  qualification: number;
  active: boolean;
  createdAt: string;
}
