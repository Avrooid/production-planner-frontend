import {Injectable} from "@angular/core";

export interface SortState {
  field: string;
  direction: 'asc' | 'desc' | 'default';
}

export type FilterState = Map<string, any[]>;

@Injectable()
export class FilterSortService<T> {

  private sortState: SortState = { field: '', direction: 'default' };
  private filterState: FilterState = new Map();
  private originalItems: T[] = [];
  private filteredItems: T[] = [];

  constructor() {}

  initialize(items: T[], initialFilters?: FilterState): void {
    this.originalItems = [...items];
    this.filteredItems = [...items];

    if (initialFilters) {
      this.filterState = new Map(initialFilters);
      this.applyFilter();
    }
  }

  toggleSort(field: string): void {
    if (this.sortState.field !== field) {
      // Новый столбец
      this.sortState = { field, direction: 'asc' };
    } else {
      // Тот же столбец - переключаем состояние
      switch (this.sortState.direction) {
        case 'asc':
          this.sortState.direction = 'desc';
          break;
        case 'desc':
          this.sortState = { field: '', direction: 'default' };
          break;
        case 'default':
          this.sortState = { field, direction: 'asc' };
          break;
      }
    }

    this.applySorting();
  }

  private applySorting(): void {
    if (this.sortState.field && this.sortState.direction !== 'default') {
      this.filteredItems = this.sortItems(this.filteredItems, this.sortState.field, this.sortState.direction);
    } else {
      this.filteredItems = this.sortById(this.filteredItems);
    }
  }

  private sortItems(items: T[], field: string, direction: 'asc' | 'desc'): T[] {
    return [...items].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];

      // Числовая сортировка
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Строковая сортировка (на всякий случай)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Общая логика
      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  private sortById(items: T[]): T[] {
    return [...items].sort((a: any, b: any) => a.id - b.id);
  }

  // ФИЛЬТРАЦИЯ
  addFilterValue(field: string, value: any): void {
    const currentValues = this.filterState.get(field) || [];
    if (!currentValues.includes(value)) {
      this.filterState.set(field, [...currentValues, value]);
      this.applyFilter();
    }
  }

  removeFilterValue(field: string, value: any): void {
    const currentValues = this.filterState.get(field);
    if (currentValues) {
      const newValues = currentValues.filter(v => v !== value);
      // Всегда оставляем поле в Map, даже с пустым массивом
      this.filterState.set(field, newValues);
      this.applyFilter();
    }
  }

  toggleFilterValue(field: string, value: any): void {
    const currentValues = this.filterState.get(field) || [];

    if (currentValues.includes(value)) {
      this.removeFilterValue(field, value);
    } else {
      this.addFilterValue(field, value);
    }
  }

  isValueSelected(field: string, value: any): boolean {
    const values = this.filterState.get(field);
    return values ? values.includes(value) : false;
  }

  isFilterActive(field: string): boolean {
    const values = this.filterState.get(field);
    return values ? values.length > 0 : false;
  }

  private applyFilter(): void {
    this.filteredItems = this.originalItems.filter(item => {
      return this.matchesAllFilters(item);
    });
    this.applySorting();
  }

  private matchesAllFilters(item: T): boolean {
    for (const [field, allowedValues] of this.filterState) {
      // Если для поля нет выбранных значений - пропускаем фильтрацию
      if (allowedValues.length === 0) {
        continue;
      }

      if (!this.matchesFilter(item, field, allowedValues)) {
        return false;
      }
    }
    return true;
  }

  private matchesFilter(item: T, field: string, allowedValues: any[]): boolean {
    const itemValue = (item as any)[field];
    return allowedValues.includes(itemValue);
  }


  getItems(): T[] {
    return this.filteredItems;
  }

  getSortState(): SortState {
    return this.sortState;
  }

  getFilterState(): FilterState {
    return this.filterState;
  }

}
