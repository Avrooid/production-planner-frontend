export interface SessionOrderDetails {
  productId: number;
  productionType: 'serial' | 'non_serial' | string;
  quantity: number;
  deadlineDate: string | Date;
  source: string;
}
