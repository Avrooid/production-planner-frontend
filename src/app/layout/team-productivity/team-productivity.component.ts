import {Component, OnInit} from '@angular/core';
import {TeamService} from "../../service/http/team-service";
import {ProductService} from "../../service/http/product-service";
import {AlertService} from "../../service/alert-service";
import {TeamDto} from "../../domain/teams/team-dto";
import {ProductDto} from "../../domain/products/product-dto";
import {TeamProductivityService} from "../../service/http/team-productivity-service";
import {TeamProductivityDto} from "../../domain/team-productivity/team-productivity-dto";
import {forkJoin} from "rxjs";
import {
  faBusinessTime,
  faEdit,
  faFilter,
  faIndustry,
  faPlus, faSearch,
  faSortDown,
  faSortUp,
  faTrash,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import {TeamProductivityDetails} from "../../domain/team-productivity/team-productivity-details";
import {ProductionType} from "../../domain/team-productivity/production-type";

@Component({
  selector: 'app-team-productivity',
  templateUrl: './team-productivity.component.html',
  styleUrl: './team-productivity.component.scss'
})
export class TeamProductivityComponent implements OnInit{

  teams: TeamDto[] = [];
  selectedTeamIndex: number = -1;
  selectedTeam: TeamDto | null = null;

  products: ProductDto[] = [];

  teamProductivities: TeamProductivityDto[] = [];

  isLoading: boolean = false;
  isSearchFocused: boolean = false;

  isModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  editingProductivity: boolean = false;

  // Текущие данные для формы
  currentProductivity: TeamProductivityDetails = {
    teamId: 0,
    productId: 0,
    productionType: 'serial',
    qualification: 1,
    productivity: 0.01
  };

  productivityToDelete: TeamProductivityDto | null = null;

  constructor(private teamService: TeamService,
              private productService: ProductService,
              private teamProductivityService: TeamProductivityService,
              private alertService: AlertService) {

  }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin({
      teams: this.teamService.getTeams(),
      products: this.productService.getAllProducts(),
      productivities: this.teamProductivityService.getAllTeamProductivity()
    }).subscribe({
      next: (results) => {
        this.teams = results.teams;
        this.products = results.products;
        this.teamProductivities = results.productivities;

        console.log('teams:', this.teams);
        console.log('products:', this.products);
        console.log('teamProductivities:', this.teamProductivities);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Ошибка загрузки данных:', error);
        this.isLoading = false;
      }
    });
  }

  getTeamProductivities(teamId: number): TeamProductivityDto[] {
    return this.teamProductivities.filter(productivity => productivity.team.id === teamId);
  }

  selectTeam(index: number): void {
    this.selectedTeamIndex = index;
    this.selectedTeam = this.teams[index];
  }

  clearSelection(): void {
    this.selectedTeamIndex = -1;
    this.selectedTeam = null;
  }

  // Открытие модального окна для добавления
  openAddModal(): void {
    this.editingProductivity = false;
    this.currentProductivity = {
      teamId: this.selectedTeam!.id,
      productId: 0,
      productionType: 'serial',
      qualification: 1,
      productivity: 0.01
    };
    this.isModalOpen = true;
  }

  // Открытие модального окна для редактирования
  openEditModal(productivity: TeamProductivityDto): void {
    this.editingProductivity = true;
    this.currentProductivity = {
      teamId: productivity.team.id,
      productId: productivity.product.id,
      productionType: productivity.productionType,
      qualification: productivity.qualification,
      productivity: productivity.productivity
    };
    this.productivityToDelete = productivity; // сохраняем для удаления
    this.isModalOpen = true;
  }

  // Сохранение производительности
  saveProductivity(): void {
    if (this.editingProductivity && this.productivityToDelete) {
      this.isLoading = true;
      this.teamProductivityService.updateTeamProductivity(
        this.productivityToDelete.id,
        this.currentProductivity
      ).subscribe({
        next: (updated) => {
          const index = this.teamProductivities.findIndex(p => p.id === updated.id);
          if (index !== -1) {
            this.teamProductivities[index] = updated;
          }
          this.alertService.success(`Продуктивность успешно обновлена`);
        },
        error: (error) => {
          this.alertService.error('Ошибка обновления продуктивности');
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
      this.teamProductivityService.createTeamProductivity(this.currentProductivity)
        .subscribe({
          next: (created) => {
            this.teamProductivities.push(created);
            this.alertService.success(`Продуктивность успешно создана`);
          },
          error: (error) => {
            this.alertService.error('Ошибка создания продуктивности')
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

  // Открытие модального окна для удаления
  openDeleteModal(productivity: TeamProductivityDto): void {
    this.productivityToDelete = productivity;
    this.isDeleteModalOpen = true;
  }

  // Подтверждение удаления
  confirmDelete(): void {
    this.isLoading = true;
    if (this.productivityToDelete) {
      this.teamProductivityService.deleteTeamProductivity(this.productivityToDelete.id)
        .subscribe({
          next: () => {
            // Удаляем из массива
            this.teamProductivities = this.teamProductivities.filter(
              p => p.id !== this.productivityToDelete!.id
            );
            this.alertService.success("Продуктивность успешно удалена");
          },
          error: (error) => {
            this.alertService.error("Ошибка удаления продуктивности");
            this.isLoading = false;
            this.closeDeleteModal();
          },
          complete: () => {
            this.isLoading = false;
            this.closeDeleteModal();
          }
        });
    }
  }

  // Закрытие модального окна добавления/редактирования
  closeModal(): void {
    this.isModalOpen = false;
    this.editingProductivity = false;
    this.currentProductivity = {
      teamId: 0,
      productId: 0,
      productionType: 'serial',
      qualification: 1,
      productivity: 0.01
    };
    this.productivityToDelete = null;
  }

  // Закрытие модального окна удаления
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.productivityToDelete = null;
  }

  // Получить название изделия по ID
  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Неизвестно';
  }

  onSearchBlur() {
    this.isSearchFocused = false;
  }

  onSearchFocus() {
    this.isSearchFocused = true;
  }

  protected readonly faSortDown = faSortDown;
  protected readonly faSortUp = faSortUp;
  protected readonly faFilter = faFilter;
  protected readonly faEdit = faEdit;
  protected readonly faTrash = faTrash;
  protected readonly faXmark = faXmark;
  protected readonly faIndustry = faIndustry;
  protected readonly faPlus = faPlus;
  protected readonly faSearch = faSearch;
  protected readonly faBusinessTime = faBusinessTime;
}
