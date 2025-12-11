import {HttpClient} from "@angular/common/http";
import {EmployeeDto} from "../../domain/employees/employee-dto";
import {map, Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {EmployeeDetails} from "../../domain/employees/employee-details";

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {

  private readonly baseUrl = '/api/v1/employees'; // Подставь реальный базовый URL API

  constructor(private http: HttpClient) {}

  // Получить всех сотрудников
  getEmployees(): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(this.baseUrl);
  }

  // Получить сотрудников по id команды
  getEmployeesByTeam(teamId: number): Observable<EmployeeDto[]> {
    return this.http.get<EmployeeDto[]>(`${this.baseUrl}/team/${teamId}`);
  }

  // Создать нового сотрудника
  createEmployee(employee: EmployeeDetails): Observable<EmployeeDto> {
    return this.http.post<EmployeeDto>(this.baseUrl, employee);
  }

  // Обновить существующего сотрудника
  updateEmployee(employeeId: number, employee: EmployeeDetails): Observable<EmployeeDto> {
    return this.http.put<EmployeeDto>(`${this.baseUrl}/${employeeId}`, employee);
  }

  // Опционально: удалить сотрудника (если добавишь endpoint DELETE)
  deleteEmployee(employeeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${employeeId}`);
  }
}
