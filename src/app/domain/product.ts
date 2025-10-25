export interface Product {
  name: string;
  serialPlan: number | null;
  nonSerialPlan: number | null;
  assemblyRate: number | null;
  productionRates: { [brigade: string]: number };
  qualifications: { [brigade: string]: number };
}
