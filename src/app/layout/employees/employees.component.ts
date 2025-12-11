import {Component, OnInit} from '@angular/core';
import {EmployeeDto} from "../../domain/employees/employee-dto";
import {TeamDto} from "../../domain/teams/team-dto";
import {EmployeeDetails} from "../../domain/employees/employee-details";
import {TeamService} from "../../service/http/team-service";
import {AlertService} from "../../service/alert-service";
import {
  faEdit,
  faFilter,
  faPlus,
  faSearch, faSortDown,
  faSortUp,
  faTrash,
  faUser,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import {EmployeeService} from "../../service/http/employee-service";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {

  // Данные
  employees: EmployeeDto[] = [];
  filteredEmployees: EmployeeDto[] = [];
  teams: TeamDto[] = [];

  // Поиск
  searchQuery: string = '';
  isSearchFocused: boolean = false;

  // Фильтры
  activeFilter: string = '';
  filterValues: any = {
    teamId: [],
    isActive: []
  };

  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Модальные окна
  isModalOpen = false;
  isDeleteModalOpen = false;
  editingEmployee: EmployeeDto | null = null;
  employeeToDelete: EmployeeDto | null = null;
  currentEmployee: EmployeeDetails = {
    fullName: '',
    teamId: -1,
    position: '',
    qualification: 1,
    active: true
  };

  isLoading: boolean = false;

  constructor(
    private employeeService: EmployeeService,
    private teamService: TeamService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

// ================= ЗАГРУЗКА ДАННЫХ =================
  loadAllData(): void {
    this.isLoading = true;

    forkJoin({
      teams: this.teamService.getTeams(),
      employees: this.employeeService.getEmployees()
    }).subscribe({
      next: (results) => {
        this.teams = results.teams;
        this.employees = results.employees;
        this.filteredEmployees = [...results.employees];
        console.log('Загруженные сотрудники:', this.filteredEmployees);
      },
      error: () => {
        this.alertService.error('Не удалось загрузить данные');
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // ================= ПОИСК =================
  onSearchFocus(): void { this.isSearchFocused = true; }
  onSearchBlur(): void { this.isSearchFocused = false; }

  // ================= ФИЛЬТРАЦИЯ =================
  toggleFilter(field: string): void {
    this.activeFilter = this.activeFilter === field ? '' : field;
  }

  hasActiveTeamFilter(): boolean { return this.filterValues.teamId?.length > 0; }
  hasActiveStatusFilter(): boolean { return this.filterValues.isActive?.length > 0; }

  onFilterChange(field: string, value: any, event: any): void {
    if (!this.filterValues[field]) this.filterValues[field] = [];

    if (event.target.checked) {
      if (!this.filterValues[field].includes(value)) this.filterValues[field].push(value);
    } else {
      const index = this.filterValues[field].indexOf(value);
      if (index > -1) this.filterValues[field].splice(index, 1);
    }
    this.applyFilters();
  }

  // ================= ПРИМЕНЕНИЕ ФИЛЬТРОВ =================

  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  private sortEmployees(employees: EmployeeDto[]): EmployeeDto[] {
    if (!this.sortField) return employees;

    return employees.sort((a, b) => {
      const aValue = (a as any)[this.sortField];
      const bValue = (b as any)[this.sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }

  applyFilters(): void {
    let result = [...this.employees];

    // Поиск по ФИО
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(emp => emp.fullName.toLowerCase().includes(query));
    }

    // Фильтр по команде
    if (this.filterValues.teamId?.length) {
      result = result.filter(emp => this.filterValues.teamId.includes(emp.team.id));
    }

    // Фильтр по статусу
    if (this.filterValues.isActive?.length) {
      result = result.filter(emp => this.filterValues.isActive.includes(emp.active));
    }

    this.filteredEmployees = result;
    this.filteredEmployees = this.sortEmployees(this.filteredEmployees);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterValues = { teamId: [], isActive: [] };
    this.activeFilter = '';
    this.applyFilters();
  }

  // ================= МОДАЛЬНЫЕ ОКНА =================
  openAddModal(): void {
    this.editingEmployee = null;
    this.currentEmployee = { fullName: '', position: '', qualification: 1, teamId: -1, active: true };
    this.isModalOpen = true;
  }

  openEditModal(emp: EmployeeDto): void {
    this.editingEmployee = emp;
    this.currentEmployee = {
      fullName: emp.fullName,
      position: emp.position,
      qualification: emp.qualification,
      teamId: emp.team.id,
      active: emp.active
    };
    this.isModalOpen = true;
  }

  closeModal(): void { this.isModalOpen = false; this.editingEmployee = null; }

  saveEmployee(): void {
    if (!this.currentEmployee.fullName.trim() || !this.currentEmployee.teamId) return;

    if (this.editingEmployee) {
      this.isLoading = true;
      this.employeeService.updateEmployee(this.editingEmployee.id, this.currentEmployee).subscribe({
        next: updated => {
          const index = this.employees.findIndex(e => e.id === this.editingEmployee!.id);
          if (index !== -1) this.employees[index] = updated;
          this.applyFilters();
          this.alertService.success(`Сотрудник "${updated.fullName}" успешно обновлен`);
        },
        error: () => {
          this.alertService.error('Ошибка обновления сотрудника');
          this.closeModal();
          this.isLoading = false;
        },
        complete: () => {
          this.closeModal();
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = true;
      this.employeeService.createEmployee(this.currentEmployee).subscribe({
        next: added => {
          this.employees.push(added);
          this.applyFilters();
          this.alertService.success(`Сотрудник "${added.fullName}" успешно сохранен`);
        },
        error: () => {
          this.alertService.error('Ошибка создания сотрудника');
          this.closeModal();
          this.isLoading = false;
        },
        complete: () => {
          this.closeModal();
          this.isLoading = false;
        }
      });
    }
  }

  // ================= УДАЛЕНИЕ =================
  openDeleteModal(emp: EmployeeDto): void { this.employeeToDelete = emp; this.isDeleteModalOpen = true; }
  closeDeleteModal(): void { this.employeeToDelete = null; this.isDeleteModalOpen = false; }

  confirmDelete(): void {
    if (!this.employeeToDelete) return;

    this.isLoading = true;
    this.employeeService.deleteEmployee(this.employeeToDelete.id).subscribe({
      next: () => {
        this.employees = this.employees.filter(e => e.id !== this.employeeToDelete!.id);
        this.applyFilters();
        this.alertService.success(`Сотрудник "${this.employeeToDelete?.fullName}" успешно удален`);
      },
      error: () => {
        this.alertService.error('Ошибка удаления сотрудника');
        this.closeDeleteModal();
        this.isLoading = false;
      },
      complete: () => {
        this.closeDeleteModal();
        this.isLoading = false;
      }
    });
  }

  // ================= ВСПОМОГАТЕЛЬНЫЕ =================
  getTeamName(teamId: number): string {
    return this.teams.find(t => t.id === teamId)?.name || '';
  }

  isFormValid(): boolean {
    return !!(this.currentEmployee.fullName?.trim() &&
      this.currentEmployee.position?.trim() &&
      this.currentEmployee.qualification &&
      this.currentEmployee.teamId != null &&
      this.currentEmployee.teamId > 0 &&
      this.currentEmployee.active !== undefined);
  }

  // ================= ИКОНКИ =================
  protected readonly faSearch = faSearch;
  protected readonly faPlus = faPlus;
  protected readonly faUser = faUser;
  protected readonly faFilter = faFilter;
  protected readonly faEdit = faEdit;
  protected readonly faTrash = faTrash;
  protected readonly faXmark = faXmark;
  protected readonly faSortUp = faSortUp;
  protected readonly faSortDown = faSortDown;
}
