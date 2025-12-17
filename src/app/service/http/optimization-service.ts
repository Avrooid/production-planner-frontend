import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {OptimizationRunDto} from "../../domain/optimization/optimization-run-dto";
import {OptimizationRunDetails} from "../../domain/optimization/optimization-run-details";
import {OptimizationResultDto} from "../../domain/optimization/optimization-result-dto";

@Injectable({
  providedIn: 'root'
})
export class OptimizationService {
  private apiUrl = '/api/v1/optimization';

  constructor(private http: HttpClient) {}

  /**
   * Получить список активных параметров оптимизации
   */
  getActiveOptimizationRuns(): Observable<OptimizationRunDto[]> {
    return this.http.get<OptimizationRunDto[]>(this.apiUrl);
  }

  /**
   * Создать новый параметр оптимизации
   */
  createOptimizationRun(optimizationRunDetails: OptimizationRunDetails): Observable<OptimizationRunDto> {
    return this.http.post<OptimizationRunDto>(this.apiUrl, optimizationRunDetails);
  }

  /**
   * Данные нового параметра оптимизации
   */
  optimize(optimizationRunId: number): Observable<OptimizationResultDto[]> {
    return this.http.post<OptimizationResultDto[]>(`${this.apiUrl}/optimize/${optimizationRunId}`, {});
  }

  /**
   * Обновить параметр оптимизации по ID
   */
  updateOptimizationRun(id: number, optimizationRunDetails: OptimizationRunDetails): Observable<OptimizationRunDto> {
    return this.http.put<OptimizationRunDto>(`${this.apiUrl}/${id}`, optimizationRunDetails);
  }
}
