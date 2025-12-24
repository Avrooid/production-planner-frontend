import {Component, OnInit} from '@angular/core';
import {
  faEdit,
  faFilter, faIndustry,
  faPlus,
  faSearch,
  faSortDown,
  faSortUp,
  faTrash,
  faUsers, faXmark
} from "@fortawesome/free-solid-svg-icons";
import {ProductDto} from "../../domain/products/product-dto";
import {AlertService} from "../../service/alert-service";
import {FilterSortService} from "../../service/FilterSortService";
import {TeamDto} from "../../domain/teams/team-dto";
import {LoadingService} from "../../service/LoadingService";
import {ProductService} from "../../service/http/product-service";
import {ProductDetails} from "../../domain/products/product-details";

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  providers: [FilterSortService]
})
export class ProductsComponent implements OnInit {

  products: ProductDto[] = [];
  filteredProducts: ProductDto[] = [];

  searchQuery: string = '';
  isSearchFocused: boolean = false;

  activeFilter: string = '';
  filterValues: any = {
    active: [true, false] // по умолчанию показываем все
  };
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  isModalOpen = false;
  editingProduct: boolean = false;
  currentProduct: ProductDto = {
    id: 0,
    name: '',
    assemblyProductivity: 0,
    active: true,
    createdAt: ''
  };

  isDeleteModalOpen = false;
  productToDelete: ProductDto | null = null;

  isLoading = false;

  constructor(private alertService: AlertService,
              private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAllProducts().subscribe(value => {
      this.products = value;
      this.filteredProducts = [...value];
      console.log(this.products);
    }, error => {
      this.alertService.error("Ошибка при получении данных");
      this.isLoading = false;
    }, () => {
      this.isLoading = false;
    })
  }

  // Поисковик
  onSearchFocus() {
    this.isSearchFocused = true;
  }

  onSearchBlur() {
    this.isSearchFocused = false;
  }

  onSearchInput(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilters();
  }

  // ================= СОРТИРОВКА =================
  toggleFilter(field: string): void {
    this.activeFilter = this.activeFilter === field ? '' : field;
  }

  hasActiveStatusFilter(): boolean {
    return this.filterValues.active?.length > 0 &&
      !(this.filterValues.active.length === 2 &&
        this.filterValues.active.includes(true) &&
        this.filterValues.active.includes(false));
  }

  onFilterChange(field: string, value: any, event: any): void {
    if (!this.filterValues[field]) {
      this.filterValues[field] = [];
    }

    if (event.target.checked) {
      if (!this.filterValues[field].includes(value)) {
        this.filterValues[field].push(value);
      }
    } else {
      const index = this.filterValues[field].indexOf(value);
      if (index > -1) {
        this.filterValues[field].splice(index, 1);
      }
    }

    // Если все значения сняты, показываем все
    if (this.filterValues[field].length === 0) {
      this.filterValues[field] = [true, false];
    }

    this.applyFilters();
  }

  // ================= СОРТИРОВКА =================
  toggleSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // ================= ПРИМЕНЕНИЕ ФИЛЬТРОВ И СОРТИРОВКИ =================
  private sortProducts(products: ProductDto[]): ProductDto[] {
    if (!this.sortField) return products;

    return products.sort((a, b) => {
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

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
        return this.sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    // Поиск по названию
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Фильтр по статусу
    if (this.filterValues.active?.length) {
      result = result.filter(product =>
        this.filterValues.active.includes(product.active)
      );
    }

    // Применяем сортировку
    result = this.sortProducts(result);

    this.filteredProducts = result;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterValues = { active: [true, false] };
    this.activeFilter = '';
    this.sortField = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  // Модальные окна
  openAddModal(): void {
    this.editingProduct = false;
    this.currentProduct = {
      id: 0,
      name: '',
      assemblyProductivity: 0,
      active: true,
      createdAt: new Date().toISOString()
    };
    this.isModalOpen = true;
  }

  openEditModal(product: ProductDto): void {
    this.editingProduct = true;
    this.currentProduct = { ...product };
    this.isModalOpen = true;
  }

  openDeleteModal(product: ProductDto) {
    this.productToDelete = product;
    this.isDeleteModalOpen = true;
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.isLoading = true;
    this.productService.deleteProduct(this.productToDelete.id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== this.productToDelete!.id);
        this.applyFilters();
        this.alertService.success(`Изделие "${this.productToDelete!.name}" успешно удалено`);
      },
      error: () => {
        this.alertService.error('Ошибка удаления изделия');
        this.closeDeleteModal();
        this.isLoading = false;
      },
      complete: () => {
        this.closeDeleteModal();
        this.isLoading = false;
      }
    });
  }

  closeDeleteModal() {
    this.productToDelete = null;
    this.isDeleteModalOpen = false;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveProduct(): void {
    if (!this.currentProduct.name.trim()) {
      return;
    }

    if (this.editingProduct) {
      // Обновление изделия
      this.isLoading = true;
      const productDetails: ProductDetails = {
        name: this.currentProduct.name,
        assemblyProductivity: 1,
        active: this.currentProduct.active
      };

      this.productService.updateProduct(this.currentProduct.id, productDetails).subscribe({
        next: (updated) => {
          const index = this.products.findIndex(p => p.id === this.currentProduct.id);
          if (index !== -1) this.products[index] = updated;
          this.applyFilters();
          this.alertService.success(`Изделие "${updated.name}" успешно обновлено`);
        },
        error: () => {
          this.alertService.error('Ошибка обновления изделия');
          this.closeModal();
          this.isLoading = false;
        },
        complete: () => {
          this.closeModal();
          this.isLoading = false;
        }
      });
    } else {
      // Создание изделия
      this.isLoading = true;
      const productDetails: ProductDetails = {
        name: this.currentProduct.name,
        assemblyProductivity: 1,
        active: this.currentProduct.active
      };

      this.productService.createProduct(productDetails).subscribe({
        next: (added) => {
          this.products.push(added);
          this.applyFilters();
          this.alertService.success(`Изделие "${added.name}" успешно создано`);
        },
        error: () => {
          this.alertService.error('Ошибка создания изделия');
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

  protected readonly faSearch = faSearch;
  protected readonly faUsers = faUsers;
  protected readonly faPlus = faPlus;
  protected readonly faSortDown = faSortDown;
  protected readonly faTrash = faTrash;
  protected readonly faFilter = faFilter;
  protected readonly faEdit = faEdit;
  protected readonly faSortUp = faSortUp;
  protected readonly faIndustry = faIndustry;
  protected readonly faXmark = faXmark;
}
