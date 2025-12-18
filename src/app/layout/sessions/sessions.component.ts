import {Component, OnInit} from '@angular/core';
import {AlertService} from "../../service/alert-service";
import {ProductionSessionService} from "../../service/http/production-session-service";
import {ProductionSessionDto} from "../../domain/production-session/production-session-dto";
import {
  faCalculator,
  faClock,
  faEdit,
  faPlay,
  faPlus,
  faSearch,
  faTrash,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import {SessionOrderDto} from "../../domain/production-session/session-order-dto";
import {ProductDto} from "../../domain/products/product-dto";
import {ProductService} from "../../service/http/product-service";
import {SessionOrderDetails} from "../../domain/production-session/session-order-details";
import {ProductionSessionDetails} from "../../domain/production-session/production-session-details";
import {forkJoin} from "rxjs";
import {OptimizationRunDetails} from "../../domain/optimization/optimization-run-details";
import {OptimizationService} from "../../service/http/optimization-service";
import {OptimizationRunDto} from "../../domain/optimization/optimization-run-dto";

@Component({
  selector: 'app-sessions',
  templateUrl: './sessions.component.html',
  styleUrl: './sessions.component.scss'
})
export class SessionsComponent implements OnInit {

  productionSessions: ProductionSessionDto[] = [];
  selectedSession: ProductionSessionDto | null = null;
  selectedSessionIndex: number = -1;

  products: ProductDto[] = [];

  optimizations: OptimizationRunDto[] = [];
  optimizationsBySession: OptimizationRunDto[] = [];
  editingOptimization = false;
  currentOptimizationId?: number;

  isLoading: boolean = false;
  isSearchFocused: boolean = false;
  searchQuery = '';
  activeTab: 'orders' | 'optimization' = 'orders';

  isSessionModalOpen = false;
  isOrderModalOpen = false;
  isOptimizationModalOpen = false;
  isDeleteSessionModalOpen = false;
  isDeleteOrderModalOpen = false;
  editingSession = false;
  editingOrder = false;

  currentSession: ProductionSessionDetails = {
    name: '',
    startDate: new Date().toISOString().split('T')[0]
  };

  currentOrder: SessionOrderDetails = {
    productId: 0,
    productionType: 'serial',
    quantity: 1,
    deadlineDate: new Date().toISOString().split('T')[0],
    source: ''
  };

  currentOptimization: OptimizationRunDetails = {
    runTimestamp: this.getTodayDate(),
    modelVersion: 'v1.0.0',
    kTardyDefault: 1.0,
    kUnder: 0.5,
    kOver: 0.5,
    alpha: 0.1,
    beta: 0.1,
    deltaBuffer: 0.05,
    comment: '',
    productionSessionId: -1
  };

  sessionToDelete: ProductionSessionDto | null = null;
  orderToDelete: SessionOrderDto | null = null;

  constructor(private alertService: AlertService,
              private productionSessionService: ProductionSessionService,
              private productService: ProductService,
              private optimizationService: OptimizationService) {

  }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin({
      sessions: this.productionSessionService.getAllProductionSessions(),
      products: this.productService.getAllProducts(),
      optimizations: this.optimizationService.getActiveOptimizationRuns()
    }).subscribe({
      next: ({ sessions, products, optimizations }) => {
        this.productionSessions = sessions;
        this.products = products;
        this.optimizations = optimizations;

        console.log('Сессии:', this.productionSessions);
        console.log('Изделия:', this.products);
        console.log('Оптимизации:', this.optimizations);

        // Автовыбор первой сессии, если есть
        if (sessions.length > 0 && this.selectedSessionIndex === -1) {
          this.selectSession(0);
        }
      },
      error: (err) => {
        console.error('Ошибка загрузки данных:', err);
        this.alertService.error("Не удалось загрузить данные");
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  onSearchFocus() {
    this.isSearchFocused = true;
  }

  onSearchBlur() {
    this.isSearchFocused = false;
  }

  onSearchInput() {

  }

  selectSession(index: number) {
    this.selectedSessionIndex = index;
    this.selectedSession = this.productionSessions[index];
    this.filterOptimizations();
  }

  private filterOptimizations() {
    this.optimizationsBySession = this.optimizations.filter(opt => opt.productionSession.id === this.selectedSession?.id);
  }

  openAddSessionModal(): void {
    this.editingSession = false;
    this.currentSession = {
      name: '',
      startDate: new Date().toISOString().split('T')[0]
    };
    this.isSessionModalOpen = true;
  }

  openEditSessionModal(session: ProductionSessionDto, $event: MouseEvent): void {
    $event.stopPropagation();
    this.editingSession = true;
    this.currentSession = {
      name: session.name,
      startDate: typeof session.startDate === 'string'
        ? session.startDate.split('T')[0]
        : (session.startDate as Date).toISOString().split('T')[0]
    };
    this.sessionToDelete = session;
    this.isSessionModalOpen = true;
  }

  closeSessionModal(): void {
    this.isSessionModalOpen = false;
    this.editingSession = false;
    this.sessionToDelete = null;
  }

  saveSession(): void {
    if (this.editingSession && this.sessionToDelete) {
      this.isLoading = true;
      this.productionSessionService.updateProductionSession(
        this.sessionToDelete.id,
        this.currentSession
      ).subscribe({
        next: (updatedSession) => {
          const index = this.productionSessions.findIndex(s => s.id === updatedSession.id);
          if (index !== -1) {
            this.productionSessions[index] = updatedSession;
          }
          this.alertService.success(`Сессия "${updatedSession.name}" успешно обновлена`);
        },
        error: (error) => {
          this.closeSessionModal();
          this.alertService.error("Ошибка обновления сессии");
          this.isLoading = false;
        },
        complete: () => {
          this.closeSessionModal();
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = true;
      this.productionSessionService.createProductionSession(this.currentSession).subscribe({
        next: (newSession) => {
          this.productionSessions.push(newSession);
          this.selectSession(this.productionSessions.length - 1);
          this.alertService.success(`Сессия "${newSession.name}" успешно создана`);
        },
        error: (error) => {
          this.alertService.error('Ошибка создания сессии');
          this.closeSessionModal();
          this.isLoading = false;
        },
        complete: () => {
          this.closeSessionModal();
          this.isLoading = false;
        }
      });
    }
  }

  openAddOrderModal(): void {
    this.editingOrder = false;
    this.currentOrder = {
      productId: 0,
      productionType: 'serial',
      quantity: 1,
      deadlineDate: new Date().toISOString().split('T')[0],
      source: ''
    };
    this.isOrderModalOpen = true;
  }

  openEditOrderModal(order: SessionOrderDto): void {
    this.editingOrder = true;
    this.currentOrder = {
      productId: order.product.id,
      productionType: order.productionType,
      quantity: order.quantity || 1,
      deadlineDate: typeof order.deadlineDate === 'string'
        ? order.deadlineDate.split('T')[0]
        : (order.deadlineDate as Date).toISOString().split('T')[0],
      source: order.source || ''
    };
    this.orderToDelete = order;
    this.isOrderModalOpen = true;
  }

  closeOrderModal(): void {
    this.isOrderModalOpen = false;
    this.editingOrder = false;
    this.orderToDelete = null;
  }

  saveOrder(): void {
    if (!this.selectedSession) return;

    this.isLoading = true;
    this.productionSessionService.createProductionSessionOrder(
      this.selectedSession.id,
      this.currentOrder
    ).subscribe({
      next: (updatedSession) => {
        // Обновляем сессию в списке
        const index = this.productionSessions.findIndex(s => s.id === updatedSession.id);
        if (index !== -1) {
          // Создаем новый массив для триггера изменений
          this.productionSessions = [
            ...this.productionSessions.slice(0, index),
            updatedSession,
            ...this.productionSessions.slice(index + 1)
          ];

          // Обновляем выбранную сессию
          if (this.selectedSessionIndex === index) {
            this.selectSession(index); // Это перезагрузит selectedSession
          }
        }
        this.alertService.success("Заказ сохранен");
      },
      error: (error) => {
        this.alertService.error("Не удалось сохранить заказ");
        this.closeOrderModal();
        this.isLoading = false;
      },
      complete: () => {
        this.closeOrderModal();
        this.isLoading = false;
      }
    });
  }

  // Удаление сессий
  openDeleteSessionModal(session: ProductionSessionDto, $event: MouseEvent): void {
    $event.stopPropagation();
    this.sessionToDelete = session;
    this.isDeleteSessionModalOpen = true;
  }

  closeDeleteSessionModal(): void {
    this.isDeleteSessionModalOpen = false;
    this.sessionToDelete = null;
  }

  confirmDeleteSession(): void {
    if (!this.sessionToDelete) return;

    this.isLoading = true;
    this.productionSessionService.deleteProductionSession(this.sessionToDelete.id).subscribe({
      next: () => {
        this.productionSessions = this.productionSessions.filter(p => p.id !== this.sessionToDelete!.id);
        this.selectedSession = null;
        this.selectedSessionIndex = -1;
        this.closeDeleteSessionModal();
        this.alertService.success(`Сессия "${this.sessionToDelete!.name}" успешно удалена`);
      },
      error: (error) => {
        this.alertService.error('Ошибка при удалении сессии');
        this.closeDeleteSessionModal();
        this.isLoading = false;
      },
      complete: () => {
        this.closeDeleteSessionModal();
        this.isLoading = false;
      }
    });
  }

  // Удаление заказов (если есть соответствующий метод в API)
  openDeleteOrderModal(order: SessionOrderDto): void {
    this.orderToDelete = order;
    this.isDeleteOrderModalOpen = true;
  }

  closeDeleteOrderModal(): void {
    this.isDeleteOrderModalOpen = false;
    this.orderToDelete = null;
  }

  confirmDeleteOrder(): void {
    if (!this.orderToDelete || !this.selectedSession) return;

    // Здесь должен быть вызов сервиса для удаления заказа
    // Если метод удаления заказа не реализован в API, нужно его добавить
    console.log('Удаление заказа:', this.orderToDelete);

    // Временная реализация - фильтрация заказов на клиенте
    if (this.selectedSession) {
      const sessionIndex = this.productionSessions.findIndex(s => s.id === this.selectedSession!.id);
      if (sessionIndex !== -1) {
        const orderIndex = this.productionSessions[sessionIndex].sessionOrders.findIndex(
          o => o.id === this.orderToDelete!.id
        );

        if (orderIndex !== -1) {
          this.productionSessions[sessionIndex].sessionOrders.splice(orderIndex, 1);
          // Клонируем массив для триггера изменения
          this.productionSessions = [...this.productionSessions];
        }
      }
    }

    this.closeDeleteOrderModal();
  }

  // Вспомогательные методы для форматирования
  formatDate(date: any): string {
    if (!date) return '';

    if (typeof date === 'string') {
      return date.split('T')[0];
    }

    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }

    return String(date);
  }

  getProductionTypeLabel(type: string): string {
    switch (type?.toLowerCase()) {
      case 'serial':
        return 'Серийное';
      case 'non_serial':
        return 'Несерийное';
      default:
        return type;
    }
  }

  protected readonly faSearch = faSearch;
  protected readonly faPlus = faPlus;
  protected readonly faClock = faClock;
  protected readonly faEdit = faEdit;
  protected readonly faTrash = faTrash;
  protected readonly faXmark = faXmark;
  protected readonly faCalculator = faCalculator;

  openOptimizationModal(id: number, optimizationRunDto?: OptimizationRunDto) {
    if (optimizationRunDto) {
      // Режим редактирования
      this.editingOptimization = true;
      this.currentOptimizationId = optimizationRunDto.id;

      // Заполняем форму данными из optimizationRunDto
      this.currentOptimization = {
        runTimestamp: optimizationRunDto.runTimestamp,
        modelVersion: optimizationRunDto.modelVersion,
        kTardyDefault: optimizationRunDto.kTardyDefault,
        kUnder: optimizationRunDto.kUnder,
        kOver: optimizationRunDto.kOver,
        alpha: optimizationRunDto.alpha,
        beta: optimizationRunDto.beta,
        deltaBuffer: optimizationRunDto.deltaBuffer,
        comment: optimizationRunDto.comment,
        productionSessionId: optimizationRunDto.productionSession.id
      };
    } else {
      // Режим создания
      this.editingOptimization = false;
      this.currentOptimizationId = undefined;
      this.currentOptimization.productionSessionId = id;
    }

    this.isOptimizationModalOpen = true;
  }

  closeOptimizationModal(): void {
    this.isOptimizationModalOpen = false;
    this.resetForm();
    this.editingOptimization = false;
    this.currentOptimizationId = undefined;
  }

  startOptimization(id: number) {
    this.optimizationService.optimize(id).subscribe({
      next: value => {
        this.alertService.success("Оптимизация успешно получена");
        console.log('Результат оптимизации', value);
      },
      error: err => {
        this.alertService.error("Ошибка в оптимизации");
        console.log(err);
      }
    })
  }

  runOptimization(): void {
    const optimizationData: OptimizationRunDetails = {
      runTimestamp: this.currentOptimization.runTimestamp,
      modelVersion: this.currentOptimization.modelVersion,
      kTardyDefault: this.currentOptimization.kTardyDefault,
      kUnder: this.currentOptimization.kUnder,
      kOver: this.currentOptimization.kOver,
      alpha: this.currentOptimization.alpha,
      beta: this.currentOptimization.beta,
      deltaBuffer: this.currentOptimization.deltaBuffer,
      comment: this.currentOptimization.comment || '',
      productionSessionId: this.currentOptimization.productionSessionId
    };

    if (this.editingOptimization && this.currentOptimizationId) {
      // Режим редактирования
      this.optimizationService.updateOptimizationRun(this.currentOptimizationId, optimizationData).subscribe({
        next: (updatedOptimization) => {
          const index = this.optimizations.findIndex(opt => opt.id === updatedOptimization.id);
          if (index !== -1) {
            this.optimizations[index] = updatedOptimization;
          }
          this.filterOptimizations();
          console.log('Оптимизация обновлена:', updatedOptimization);
          this.alertService.success("Оптимизация обновлена");
          this.closeOptimizationModal();
        },
        error: (error) => {
          this.alertService.error("Ошибка при обновлении оптимизации");
          this.closeOptimizationModal();
        }
      });
    } else {
      // Режим создания
      this.optimizationService.createOptimizationRun(optimizationData).subscribe({
        next: (createdOptimization) => {
          this.optimizations.push(createdOptimization);
          this.filterOptimizations();
          console.log('Оптимизация создана:', createdOptimization);
          this.alertService.success("Оптимизация создана");
          this.closeOptimizationModal();
        },
        error: (error) => {
          this.alertService.error("Ошибка при создании оптимизации");
          this.closeOptimizationModal();
        }
      });
    }
  }

  private resetForm(): void {
    this.currentOptimization = {
      runTimestamp: this.getTodayDate(),
      modelVersion: 'v1.0.0',
      kTardyDefault: 1.0,
      kUnder: 0.5,
      kOver: 0.5,
      alpha: 0.1,
      beta: 0.1,
      deltaBuffer: 0.05,
      comment: '',
      productionSessionId: -1
    };
  }

  private getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  protected readonly faPlay = faPlay;
}
