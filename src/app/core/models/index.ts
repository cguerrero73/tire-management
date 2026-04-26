// ============================================================
// CORE MODELS — Tire Management Module
// ============================================================

// ---------- TIRE ----------
export type TireStatus = 'MOUNTED' | 'STORE' | 'REPAIR' | 'RETREAD' | 'DISPOSED';

export interface Tire {
  // Identificación
  code: string;           // NEU-145
  brand: string;          // Michelin
  model: string;          // X Multiway
  measure: string;         // 295/80R22.5
  dot: string;            // DOT 3426CJ 0124

  // Estados
  status: TireStatus;
  registrationDate: string;
  kmAccumulated: number;
  depthMm: number;

  // Contadores
  repairCount: number;
  retreadCount: number;

  // Costos
  purchaseCost: number;
  accumulatedCost: number;

  // Posición actual (si está montado)
  currentPosition?: string;   // POS_EJE1_IZQ
  currentVehicle?: string;    // CAMION-25
}

// ---------- VEHICLE ----------
export type VehicleType = 'TRUCK' | 'SEMI' | 'TRACTOR' | 'FORKLIFT';

export interface Vehicle {
  code: string;           // CAMION-25
  type: VehicleType;
  description: string;
  kmCurrent: number;
  organization: string;
}

// ---------- POSITION ----------
export type AxlePosition = 'FRONT' | 'MIDDLE' | 'REAR';
export type SidePosition = 'LEFT' | 'RIGHT';
export type AxleType = 'DIRECTION' | 'TRACTION' | 'DRAG';

export interface Position {
  code: string;           // POS_EJE1_IZQ
  vehicleCode: string;    // CAMION-25
  axle: number;           // 1
  position: AxlePosition;
  side: SidePosition;
  isOuter: boolean;       // true = externa, false = interna (duales)
  axleType: AxleType;
  allowedMeasures: string[];  // ['295/80R22.5', '11R22.5']
}

// ---------- MOVEMENTS ----------
export type MovementType = 'MOUNT' | 'UNMOUNT' | 'EXCHANGE' | 'DISPOSE';

export interface Movement {
  id: string;
  type: MovementType;
  tireCode: string;
  fromPosition?: string;
  toPosition?: string;
  date: string;
  user: string;
  observation?: string;
}

// ---------- INSPECTIONS ----------
export interface Inspection {
  id: string;
  tireCode: string;
  date: string;
  kmVehicle: number;
  depthMm: number;
  pressure: number;
  lateralDamage: boolean;
  observation: string;
  user: string;
}

// ---------- REPAIRS ----------
export type RepairType = 'PUNCTURE' | 'VULCANIZE' | 'BAND' | 'LATERAL';

export interface Repair {
  id: string;
  tireCode: string;
  type: RepairType;
  cost: number;
  date: string;
  provider: string;
  observation: string;
}

// ---------- RETREAD ----------
export interface Retread {
  id: string;
  tireCode: string;
  provider: string;
  cost: number;
  sendDate: string;
  returnDate: string;
  retreadNumber: number;
  observation: string;
}

// ---------- ROTATION ----------
export interface RotationProposal {
  estimatedSaving: number;    // porcentaje
  additionalKm: number;       // km adicionales
  actions: RotationAction[];
}

export interface RotationAction {
  tireCode: string;
  targetPosition: string;
  reason: string;
}

// ---------- KPI ----------
export interface KpiReport {
  costPerKm: number;
  kmPerTire: number;
  retreadRate: number;
  failureRateByBrand: Record<string, number>;
  avgLifeSpan: number;
  savingByRotation: number;
}