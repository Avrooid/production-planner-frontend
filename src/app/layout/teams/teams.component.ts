import {Component, OnInit} from '@angular/core';
import {TeamDto} from "../../domain/teams/team-dto";
import {TeamType} from "../../domain/teams/team-type";
import {FilterSortService} from "../../service/FilterSortService";
import {
  faEdit,
  faFilter,
  faPlus,
  faSearch,
  faSortDown,
  faSortUp,
  faTrash,
  faUsers,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import {TeamService} from "../../service/http/team-service";
import {AlertService} from "../../service/alert-service";
import {LoadingService} from "../../service/LoadingService";
import {TeamDetails} from "../../domain/teams/team-details";
import {finalize} from "rxjs";

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrl: './teams.component.scss',
  providers: [FilterSortService]
})
export class TeamsComponent implements OnInit {
  // Данные
  teams: TeamDto[] = [];
  filteredTeams: TeamDto[] = [];

  // Поиск
  searchQuery: string = '';
  isSearchFocused: boolean = false;

  // Сортировка
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Фильтрация
  activeFilter: string = '';
  filterValues: any = {
    teamType: [],
    is_active: []
  };

  // Модальные окна
  isModalOpen = false;
  isDeleteModalOpen = false;
  editingTeam: TeamDto | null = null;
  teamToDelete: TeamDto | null = null;
  currentTeam: TeamDetails = {
    name: '',
    teamType: 'production',
    employeeCount: 0,
    monthlyHours: 0,
    maxDailyHours: 0,
    active: true
  };

  // Для валидации формы
  teamFormInvalid = false;

  isLoading: boolean = false;

  constructor(private teamService: TeamService,
              private alertService: AlertService,
              private loadingService: LoadingService) {}

  ngOnInit() {
    this.loadTeams();
  }

  // Загрузка данных
  loadTeams(): void {
    this.isLoading = true;
    this.teamService.getTeams().subscribe(
      value => {
        this.teams = value;
        this.filteredTeams = value;
        console.log("Текущие команды:", this.filteredTeams);
        this.applyFilters();
      }, error => {
        this.alertService.error("Не удалось загрузить бригады")
      }, () => {
        this.isLoading = false;
      }
    );
  }

  // ============ ПОИСК ============
  onSearchFocus(): void {
    this.isSearchFocused = true;
  }

  onSearchBlur(): void {
    this.isSearchFocused = false;
  }

  // ============ СОРТИРОВКА ============
  toggleSort(field: string): void {
    if (this.sortField === field) {
      // Если уже сортируем по этому полю, меняем направление
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Новое поле для сортировки
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  private sortTeams(teams: TeamDto[]): TeamDto[] {
    if (!this.sortField) {
      return teams.sort((a, b) => a.id - b.id); // Сортировка по ID по умолчанию
    }

    return teams.sort((a, b) => {
      const aValue = (a as any)[this.sortField];
      const bValue = (b as any)[this.sortField];

      // Для числовых значений
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return this.sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }

      // Для строковых значений
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Общий случай
      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // ============ ФИЛЬТРАЦИЯ ============
  toggleFilter(field: string): void {
    this.activeFilter = this.activeFilter === field ? '' : field;
  }

  hasActiveTeamTypeFilter(): boolean {
    return this.filterValues['teamType'] && this.filterValues['teamType'].length > 0;
  }

  hasActiveStatusFilter(): boolean {
    return this.filterValues['is_active'] && this.filterValues['is_active'].length > 0;
  }

  onFilterChange(field: string, value: any, event: any): void {
    if (!this.filterValues[field]) {
      this.filterValues[field] = [];
    }

    if (event.target.checked) {
      // Добавляем значение, если его нет
      if (!this.filterValues[field].includes(value)) {
        this.filterValues[field].push(value);
      }
    } else {
      // Удаляем значение
      const index = this.filterValues[field].indexOf(value);
      if (index > -1) {
        this.filterValues[field].splice(index, 1);
      }
    }

    this.applyFilters();
  }

  // ============ ПРИМЕНЕНИЕ ВСЕХ ФИЛЬТРОВ ============
  applyFilters(): void {
    let result = [...this.teams];

    // 1. Поиск по названию
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(team =>
        team.name.toLowerCase().includes(query)
      );
    }

    // 2. Фильтр по типу бригады
    if (this.filterValues['teamType'] && this.filterValues['teamType'].length > 0) {
      result = result.filter(team =>
        this.filterValues['teamType'].includes(team.teamType)
      );
    }

    // 3. Фильтр по статусу
    if (this.filterValues['is_active'] && this.filterValues['is_active'].length > 0) {
      result = result.filter(team =>
        this.filterValues['is_active'].includes(team.active)
      );
    }

    // 4. Сортировка
    result = this.sortTeams(result);

    this.filteredTeams = result;
  }

  // ============ ОЧИСТКА ФИЛЬТРОВ ============
  clearFilters(): void {
    this.searchQuery = '';
    this.filterValues = {
      teamType: [],
      is_active: []
    };
    this.sortField = '';
    this.sortDirection = 'asc';
    this.activeFilter = '';
    this.applyFilters();
  }

  // ============ ОБНОВЛЕНИЕ ДАННЫХ ============
  updateTeamsAfterChange(): void {
    // После добавления/редактирования/удаления бригады
    this.applyFilters();
  }

  // ============ МОДАЛЬНЫЕ ОКНА ============

  // 1. Модальное окно добавления/редактирования
  openAddModal(): void {
    this.editingTeam = null;
    this.currentTeam = {
      name: '',
      teamType: 'production',
      employeeCount: 0,
      monthlyHours: 0,
      maxDailyHours: 0,
      active: true,
    };
    this.teamFormInvalid = false;
    this.isModalOpen = true;
  }

  openEditModal(team: TeamDto): void {
    this.editingTeam = team;

    this.currentTeam = {
      name: team.name,
      teamType: team.teamType.toLowerCase() as 'production' | 'assembly',
      employeeCount: team.employeeCount,
      monthlyHours: team.monthlyHours,
      maxDailyHours: team.maxDailyHours,
      active: team.active
    };

    this.teamFormInvalid = false;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingTeam = null;
    this.teamFormInvalid = false;
  }

  // Валидация формы
  validateForm(): boolean {
    if (!this.currentTeam.name.trim()) {
      this.teamFormInvalid = true;
      return false;
    }

    if (this.currentTeam.employeeCount <= 0) {
      this.teamFormInvalid = true;
      return false;
    }

    if (this.currentTeam.monthlyHours <= 0) {
      this.teamFormInvalid = true;
      return false;
    }

    if (this.currentTeam.maxDailyHours <= 0 || this.currentTeam.maxDailyHours > 24) {
      this.teamFormInvalid = true;
      return false;
    }

    this.teamFormInvalid = false;
    return true;
  }

  saveTeam(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;

    if (this.editingTeam) {
      this.teamService.updateTeam(this.editingTeam.id, this.currentTeam)
        .subscribe({
          next: (updatedTeam) => {
            const index = this.teams.findIndex(t => t.id === this.editingTeam!.id);
            if (index !== -1) {
              this.teams[index] = updatedTeam;
            }
            this.applyFilters(); // <-- Только здесь!
            this.alertService.success(`Бригада "${updatedTeam.name}" успешно обновлена`);
            this.closeModal(); // <-- И здесь!
          },
          error: (error) => {
            this.alertService.error("Ошибка при обновлении бригады");
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.teamService.createTeam(this.currentTeam)
        .subscribe({
          next: (newTeam) => {
            this.teams.push(newTeam);
            this.applyFilters(); // <-- Только здесь!
            this.alertService.success(`Бригада "${newTeam.name}" успешно сохранена`);
            this.closeModal(); // <-- И здесь!
          },
          error: (error) => {
            this.alertService.error("Ошибка при создании бригады");
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
    }
  }

  // 2. Модальное окно удаления
  openDeleteModal(team: TeamDto): void {
    this.teamToDelete = team;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.teamToDelete = null;
  }

  confirmDelete(): void {
    if (this.teamToDelete) {
      this.isLoading = true;
      this.teamService.deleteTeam(this.teamToDelete.id)
        .subscribe({
          next: () => {
            this.teams = this.teams.filter(team => team.id !== this.teamToDelete!.id);
            this.applyFilters();
            this.alertService.success(`Бригада "${this.teamToDelete!.name}" успешно удалена`);
          },
          error: (error) => {
            this.alertService.error("Ошибка при удалении бригады");
          },
          complete: () => {
            this.isLoading = false;
            this.closeDeleteModal();
          }
        });
    }
  }

  // Вспомогательный метод для сброса формы
  resetForm(): void {
    this.currentTeam = {
      name: '',
      teamType: 'production',
      employeeCount: 0,
      monthlyHours: 0,
      maxDailyHours: 0,
      active: true,
    };
    this.teamFormInvalid = false;
  }

  protected readonly faSearch = faSearch;
  protected readonly faPlus = faPlus;
  protected readonly faUsers = faUsers;
  protected readonly faFilter = faFilter;
  protected readonly faSortUp = faSortUp;
  protected readonly faSortDown = faSortDown;
  protected readonly faEdit = faEdit;
  protected readonly faTrash = faTrash;
  protected readonly faXmark = faXmark;
}
