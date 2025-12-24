import {Component, OnInit} from '@angular/core';
import {AlertService} from "../../service/alert-service";
import {ProductionSessionService} from "../../service/http/production-session-service";
import {ProductionSessionDto} from "../../domain/production-session/production-session-dto";
import {
  faCalculator, faCalendar, faCalendarAlt, faChartPie, faCheckCircle, faChevronDown, faChevronUp, faCircleInfo,
  faClock,
  faEdit, faEye, faHospital,
  faPlay,
  faPlus,
  faSearch, faTimes,
  faTrash, faUndo, faUserFriends, faUsers, faUserTimes,
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
import {OptimizationResultDto} from "../../domain/optimization/optimization-result-dto";
import {TeamDayWork} from "../../domain/optimization/team-day-work";
import {OrderWork} from "../../domain/optimization/order-work";
import {OptimizationCombined} from "../../domain/optimization/optimization-combined";
import {EmployeeDto} from "../../domain/employees/employee-dto";
import {EmployeeService} from "../../service/http/employee-service";
import {TeamDto} from "../../domain/teams/team-dto";

interface TeamWithEmployees {
  team: TeamDto;
  employees: EmployeeWithStatus[];
}

interface EmployeeWithStatus extends EmployeeDto {
  status: 'WORKING' | 'DAY_OFF' | 'SICK';
}

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
  combinedOptimizations: OptimizationCombined[] = []
  selectedOptimizationCombined: OptimizationCombined | null = null;

  optimizationResults: OptimizationResultDto[] = [];
  optimizationResultsBySession: OptimizationResultDto[] = [];
  selectedOptimizationResult: OptimizationResultDto | null = null;
  expandedTeamId: number | null = null;
  expandedOrderId: number | null = null;
  private teamStatsCache = new Map<number, { totalHours: number; totalQuantity: number }>();

  employees: EmployeeDto[] = [];
  teamsWithEmployees: TeamWithEmployees[] = [];
  expandedStatusTeamId: number | null = null;
  showEmployeeStatusModal = false;
  currentOptimizationIdForRunOptimization:  number | null = null;

  isLoading: boolean = false;
  isSearchFocused: boolean = false;
  searchQuery = '';
  activeTab: 'orders' | 'optimization' | 'optimizationResults' = 'orders';

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
              private employeeService: EmployeeService,
              private optimizationService: OptimizationService) {

  }

  ngOnInit(): void {
    this.isLoading = true;

    forkJoin({
      sessions: this.productionSessionService.getAllProductionSessions(),
      products: this.productService.getAllProducts(),
      optimizations: this.optimizationService.getActiveOptimizationRuns(),
      optimizationResults: this.optimizationService.getOptimizationResults(),
      employees: this.employeeService.getEmployees()
    }).subscribe({
      next: ({ sessions,
               products,
               optimizations,
               optimizationResults,
               employees}) => {
        this.productionSessions = sessions;
        this.products = products;
        this.optimizations = optimizations;
        this.optimizationResults = optimizationResults;
        this.employees = employees;

        console.log('Сессии:', this.productionSessions);
        console.log('Изделия:', this.products);
        console.log('Оптимизации:', this.optimizations);
        console.log('Результаты оптимизаций:', this.optimizationResults);
        console.log('Сотрудники:', this.employees)

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
    this.filterOptimizationsResults();
  }

  private filterOptimizations() {
    this.optimizationsBySession = this.optimizations.filter(opt => opt.productionSession.id === this.selectedSession?.id);
  }

  combineOptimizations(): OptimizationCombined[] {
    const optimizationsByDate = new Map<string, OptimizationResultDto[]>();
    const result: OptimizationCombined[] = [];

    // 1. Группируем оптимизации по workDate
    this.optimizationResultsBySession.forEach(optimization => {
      const workDate = optimization.workDate;

      if (workDate) {
        if (!optimizationsByDate.has(workDate)) {
          optimizationsByDate.set(workDate, []);
        }
        optimizationsByDate.get(workDate)!.push(optimization);
      }
    });

    // 2. Для каждой даты создаем OptimizationCombined объект
    optimizationsByDate.forEach((optimizations, workDate) => {
      // 3. Группируем по командам
      const teamsDayWork = this.combineByTeam(optimizations);

      // 4. Получаем sessionOrders (берем из первой оптимизации)
      const sessionOrders = optimizations.length > 0
        ? optimizations[0].productionSession?.sessionOrders || []
        : [];

      // 5. Вычисляем totalQuantity и totalHours
      let totalQuantity = 0;
      let totalHours = 0;

      // Суммируем по всем оптимизациям
      optimizations.forEach(optimization => {
        totalHours += optimization.plannedHours || 0;
        totalQuantity += optimization.plannedQuantity || 0;
      });

      // 6. Создаем объект OptimizationCombined
      const combined: OptimizationCombined = {
        sessionOrders,
        teamsDayWork,
        workDate,
        totalQuantity,
        totalHours
      };

      result.push(combined);
    });

    // 7. Сортируем по дате (от старых к новым)
    this.combinedOptimizations = result;
    console.log('Скомбинированные: ', this.combinedOptimizations);
    return result.sort((a, b) => a.workDate.localeCompare(b.workDate));
  }

  combineByTeam(optimizations: OptimizationResultDto[]): TeamDayWork[] {
    const teamsDayWork: TeamDayWork[] = [];

    // Создаем Map для быстрого поиска команды
    const teamWorkMap = new Map<number, TeamDayWork>();

    optimizations.forEach(optimization => {
      const teamId = optimization.team.id;

      // Создаем объект OrderWork
      const orderWork: OrderWork = {
        product: optimization.product,
        plannedHours: optimization.plannedHours,
        plannedQuantity: optimization.plannedQuantity,
        workDate: optimization.workDate,
        productionType: optimization.productionType,
        dayIndex: optimization.dayIndex
      };

      // Проверяем, есть ли уже запись для этой команды
      if (teamWorkMap.has(teamId)) {
        // Добавляем OrderWork к существующей команде
        const existingTeamWork = teamWorkMap.get(teamId)!;
        existingTeamWork.ordersWork.push(orderWork);
      } else {
        // Создаем новую запись для команды
        const newTeamWork: TeamDayWork = {
          team: optimization.team,
          ordersWork: [orderWork]
        };
        teamsDayWork.push(newTeamWork);
        teamWorkMap.set(teamId, newTeamWork);
      }
    });

    return teamsDayWork;
  }

  private filterOptimizationsResults() {
    this.optimizationResultsBySession = this.optimizationResults.filter(opt => opt.productionSession.id === this.selectedSession?.id);
    this.combineOptimizations();
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
        kTardyDefault: optimizationRunDto.tardyDefaultK,
        kUnder: optimizationRunDto.underK,
        kOver: optimizationRunDto.overK,
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
  protected readonly faCalendar = faCalendar;
  protected readonly faEye = faEye;

  openOptimizationResultModal(optimizationResult: OptimizationCombined) {
    this.selectedOptimizationCombined = optimizationResult;
    this.expandedOrderId = null;
  }

  closeOptimizationResultModal() {
    this.selectedOptimizationCombined = null;
    this.expandedOrderId = null;
  }

  toggleTeamDetails(teamId: number, teamWork: TeamDayWork) {
    if (this.expandedTeamId === teamId) {
      this.expandedTeamId = null;
    } else {
      this.expandedTeamId = teamId;
      // Предварительно вычисляем статистику для быстрого доступа
      this.calculateTeamStats(teamWork);
    }
  }

  toggleOrderDetails(orderId: number) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null;
    } else {
      this.expandedOrderId = orderId;
    }
  }

  // Вспомогательные методы для расчета статистики
  getTeamTotalHours(teamWork: TeamDayWork): number {
    if (this.teamStatsCache.has(teamWork.team.id)) {
      return this.teamStatsCache.get(teamWork.team.id)!.totalHours;
    }
    return this.calculateTeamStats(teamWork).totalHours;
  }

  getTeamTotalQuantity(teamWork: TeamDayWork): number {
    if (this.teamStatsCache.has(teamWork.team.id)) {
      return this.teamStatsCache.get(teamWork.team.id)!.totalQuantity;
    }
    return this.calculateTeamStats(teamWork).totalQuantity;
  }

  private calculateTeamStats(teamWork: TeamDayWork): { totalHours: number; totalQuantity: number } {
    const totalHours = teamWork.ordersWork.reduce((sum, work) => sum + work.plannedHours, 0);
    const totalQuantity = teamWork.ordersWork.reduce((sum, work) => sum + work.plannedQuantity, 0);

    const stats = { totalHours, totalQuantity };
    this.teamStatsCache.set(teamWork.team.id, stats);

    return stats;
  }

  getUniqueProductsCount(teamWork: TeamDayWork): number {
    const productIds = new Set(teamWork.ordersWork.map(work => work.product.id));
    return productIds.size;
  }

  getTeamsWorkingOnOrder(order: SessionOrderDto): Array<{team: any, totalQuantity: number}> {
    if (!this.selectedOptimizationCombined) return [];

    const result: Array<{team: any, totalQuantity: number}> = [];
    const productId = order.product.id;

    this.selectedOptimizationCombined.teamsDayWork.forEach(teamWork => {
      // Фильтруем работы этой бригады по нужному продукту
      const worksOnThisProduct = teamWork.ordersWork.filter(
        work => work.product.id === productId
      );

      if (worksOnThisProduct.length > 0) {
        const totalQuantity = worksOnThisProduct.reduce(
          (sum, work) => sum + work.plannedQuantity, 0
        );
        result.push({
          team: teamWork.team,
          totalQuantity
        });
      }
    });

    return result;
  }


  getTeamTypeLabel(teamType: string): string {
    const types: { [key: string]: string } = {
      'PRODUCTION': 'Производственная',
      'ASSEMBLY': 'Сборочная',
      'PACKING': 'Упаковочная'
    };
    return types[teamType] || teamType;
  }

  getSessionStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'draft': 'Черновик',
      'active': 'Активна',
      'completed': 'Завершена',
      'cancelled': 'Отменена'
    };
    return statuses[status] || status;
  }

  getSessionStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'draft': 'status-draft',
      'active': 'status-active',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return classes[status] || '';
  }



  openEmployeeStatusModal(optimizationId: number) {
    const optimization: OptimizationRunDto | undefined = this.optimizations.find(o => o.id === optimizationId);

    if (optimization) {
      // Проверяем, есть ли workDate этой optimization в combinedOptimizations
      const workDateExists = this.combinedOptimizations.some(
        combinedOpt => combinedOpt.workDate === optimization.runTimestamp
      );

      if (workDateExists) {
        this.alertService.error("Результат оптимизации на эту дату уже существует")
        return;
      }
    }


    this.currentOptimizationIdForRunOptimization = optimizationId;
    this.showEmployeeStatusModal = true;

    // Сброс состояния
    this.expandedStatusTeamId = null;
    this.teamsWithEmployees = [];
    this.groupEmployeesByTeam();
  }

  groupEmployeesByTeam() {
    const teamsMap = new Map<number, TeamWithEmployees>();

    this.employees.forEach(employee => {
      if (!employee.team) return;

      if (!teamsMap.has(employee.team.id)) {
        teamsMap.set(employee.team.id, {
          team: employee.team,
          employees: []
        });
      }

      teamsMap.get(employee.team.id)!.employees.push({
        ...employee,
        status: 'WORKING' // по умолчанию все работают
      });
    });

    this.teamsWithEmployees = Array.from(teamsMap.values());
  }

  closeEmployeeStatusModal() {
    this.showEmployeeStatusModal = false;
    this.currentOptimizationIdForRunOptimization = null;
    this.expandedStatusTeamId = null;
    this.teamsWithEmployees = [];
  }


  toggleTeam(teamId: number) {
    this.expandedStatusTeamId = this.expandedStatusTeamId === teamId ? null : teamId;
  }

  // 6. Установка статуса сотрудника
  setEmployeeStatus(employee: EmployeeWithStatus, status: 'WORKING' | 'DAY_OFF' | 'SICK') {
    employee.status = status;
  }

  // 7. Сброс всех статусов
  resetAllStatuses() {
    this.teamsWithEmployees.forEach(teamData => {
      teamData.employees.forEach(employee => {
        employee.status = 'WORKING';
      });
    });
  }
// Получение статистики
  getTotalEmployeesCount(): number {
    return this.teamsWithEmployees.reduce((sum, team) => sum + team.employees.length, 0);
  }

  getWorkingCount(): number {
    return this.teamsWithEmployees.reduce((sum, team) =>
      sum + team.employees.filter(e => e.status === 'WORKING').length, 0);
  }

  getAbsentCount(): number {
    return this.getTotalEmployeesCount() - this.getWorkingCount();
  }

// Работа с отдельной командой
  getTeamWorkingCount(teamData: TeamWithEmployees): number {
    return teamData.employees.filter(e => e.status === 'WORKING').length;
  }

  getTeamAbsentCount(teamData: TeamWithEmployees): number {
    return teamData.employees.length - this.getTeamWorkingCount(teamData);
  }

// Получение класса статуса
  getStatusClass(employee: EmployeeWithStatus): string {
    return employee.status.toLowerCase().replace('_', '-');
  }

// Получение текста статуса
  getStatusText(employee: EmployeeWithStatus): string {
    const statusMap = {
      'WORKING': 'Работает',
      'DAY_OFF': 'Отгул',
      'SICK': 'Болезнь'
    };
    return statusMap[employee.status];
  }

// Запуск оптимизации с учетом отсутствующих
  startOptimizationWithAbsences() {
    const absenceCountByTeam = new Map<number, number>();

    this.teamsWithEmployees.forEach(teamData => {
      const absentCount = this.getTeamAbsentCount(teamData);
      if (absentCount > 0) {
        absenceCountByTeam.set(teamData.team.id, absentCount);
      }
    });

    if (this.currentOptimizationIdForRunOptimization) {
      this.optimizationService.optimize(this.currentOptimizationIdForRunOptimization, absenceCountByTeam)
        .subscribe({
          next: (result) => {
            this.alertService.success('Оптимизация запущена');
            this.closeEmployeeStatusModal();
            window.location.reload();
          },
          error: (error) => {
            this.alertService.error('Ошибка при запуске оптимизации');
          }
        });
    }
  }

  protected readonly faChevronUp = faChevronUp;
  protected readonly faChevronDown = faChevronDown;
  protected readonly faUsers = faUsers;
  protected readonly faCircleInfo = faCircleInfo;
  protected readonly faChartPie = faChartPie;
  protected readonly faUserFriends = faUserFriends;
  protected readonly faCheckCircle = faCheckCircle;
  protected readonly faUserTimes = faUserTimes;
  protected readonly faCalendarAlt = faCalendarAlt;
  protected readonly faHospital = faHospital;
  protected readonly faUndo = faUndo;
  protected readonly faTimes = faTimes;

  getDisplayQuantity(sessionOrder: SessionOrderDto) {
    return sessionOrder.quantityFact !== null ? sessionOrder.quantityFact : sessionOrder.quantity;
  }
}
