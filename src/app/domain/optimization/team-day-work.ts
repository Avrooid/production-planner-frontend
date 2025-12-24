import {TeamDto} from "../teams/team-dto";
import {OrderWork} from "./order-work";

export interface TeamDayWork {
  team: TeamDto;
  ordersWork: OrderWork[];
}
