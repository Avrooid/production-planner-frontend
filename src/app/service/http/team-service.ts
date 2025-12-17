import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {TeamDto} from "../../domain/teams/team-dto";
import {TeamDetails} from "../../domain/teams/team-details";


@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private apiUrl: string = `/api/v1/teams`;

  constructor(private http: HttpClient) {}

  /**
   * Получить бригады
   */
  getTeams(): Observable<TeamDto[]> {
    return this.http.get<TeamDto[]>(this.apiUrl);
  }

  /**
   * Получить бригаду по ID
   * @param id - ID бригады
   */
  getTeam(id: number): Observable<TeamDto> {
    return this.http.get<TeamDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Создать новую бригаду
   * @param teamDetails - данные бригады
   */
  createTeam(teamDetails: TeamDetails): Observable<TeamDto> {
    return this.http.post<TeamDto>(this.apiUrl, teamDetails);
  }

  /**
   * Обновить бригаду
   * @param id - ID бригады
   * @param teamDetails - обновленные данные
   */
  updateTeam(id: number, teamDetails: TeamDetails): Observable<TeamDto> {
    return this.http.put<TeamDto>(`${this.apiUrl}/${id}`, teamDetails);
  }

  /**
   * Удалить бригаду
   * @param id - ID бригады
   */
  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


}
