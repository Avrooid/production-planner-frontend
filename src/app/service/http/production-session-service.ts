import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ProductionSessionDto} from "../../domain/production-session/production-session-dto";
import {ProductionSessionDetails} from "../../domain/production-session/production-session-details";
import {SessionOrderDetails} from "../../domain/production-session/session-order-details";

@Injectable({
  providedIn: 'root'
})
export class ProductionSessionService {
  private apiUrl = `/api/v1/sessions`;

  constructor(private http: HttpClient) {}

  getAllProductionSessions(): Observable<ProductionSessionDto[]> {
    return this.http.get<ProductionSessionDto[]>(this.apiUrl);
  }

  getProductionSession(id: number): Observable<ProductionSessionDto> {
    return this.http.get<ProductionSessionDto>(`${this.apiUrl}/${id}`);
  }

  createProductionSession(productionSessionDetails: ProductionSessionDetails): Observable<ProductionSessionDto> {
    return this.http.post<ProductionSessionDto>(this.apiUrl, productionSessionDetails);
  }

  createProductionSessionOrder(id: number, sessionOrderDetails: SessionOrderDetails): Observable<ProductionSessionDto> {
    return this.http.post<ProductionSessionDto>(`${this.apiUrl}/${id}`, sessionOrderDetails);
  }

  updateProductionSession(id: number, productionSessionDetails: ProductionSessionDetails): Observable<ProductionSessionDto> {
    return this.http.put<ProductionSessionDto>(`${this.apiUrl}/${id}`, productionSessionDetails);
  }

  deleteProductionSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
