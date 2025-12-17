import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {TeamProductivityDto} from "../../domain/team-productivity/team-productivity-dto";
import {TeamProductivityDetails} from "../../domain/team-productivity/team-productivity-details";

@Injectable({
  providedIn: 'root'
})
export class TeamProductivityService {
  private apiUrl = `/api/v1/team-productivity`;

  constructor(private http: HttpClient) {}

  /**
   * Получить все записи о производительности бригад
   */
  getAllTeamProductivity(): Observable<TeamProductivityDto[]> {
    return this.http.get<TeamProductivityDto[]>(this.apiUrl);
  }

  /**
   * Получить производительность по ID бригады
   * @param teamId ID бригады
   */
  getTeamProductivityByTeamId(teamId: number): Observable<TeamProductivityDto[]> {
    return this.http.get<TeamProductivityDto[]>(`${this.apiUrl}/team/${teamId}`);
  }

  /**
   * Получить производительность по ID продукта
   * @param productId ID продукта
   */
  getTeamProductivityByProductId(productId: number): Observable<TeamProductivityDto[]> {
    return this.http.get<TeamProductivityDto[]>(`${this.apiUrl}/product/${productId}`);
  }

  /**
   * Создать новую запись о производительности
   * @param teamProductivityDetails данные производительности
   */
  createTeamProductivity(teamProductivityDetails: TeamProductivityDetails): Observable<TeamProductivityDto> {
    return this.http.post<TeamProductivityDto>(this.apiUrl, teamProductivityDetails);
  }

  /**
   * Обновить запись о производительности
   * @param id ID записи
   * @param teamProductivityDetails обновленные данные
   */
  updateTeamProductivity(id: number, teamProductivityDetails: TeamProductivityDetails): Observable<TeamProductivityDto> {
    return this.http.put<TeamProductivityDto>(`${this.apiUrl}/${id}`, teamProductivityDetails);
  }

  /**
   * Удалить запись о производительности
   * @param id ID записи
   */
  deleteTeamProductivity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
