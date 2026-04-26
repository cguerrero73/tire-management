import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EamAdapter, GridQueryParams } from '../adapters/eam-adapter.service';
import { Vehicle, Position, Tire } from '../models';

// ============================================================
// VehicleApiService — Consulta Vehículos desde EAM
// Las DATASPY_ID son de ejemplo — ajustar con los IDs reales
// que configuremos en el sistema EAM.
// ============================================================

@Injectable({ providedIn: 'root' })
export class VehicleApiService {
  constructor(private eam: EamAdapter) {}

  // Lista todos los vehículos
  getAllVehicles(dataspyId: string): Observable<Vehicle[]> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'VEHICLES',     // función EAM
      USER_FUNCTION_NAME: 'VEHICLES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
    };
    return this.eam.getGridData<Vehicle[]>(params);
  }

  // Busca vehículo por código
  getVehicleByCode(code: string, dataspyId: string): Observable<Vehicle | null> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'VEHICLES',
      USER_FUNCTION_NAME: 'VEHICLES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
      MADDON_FILTER_ALIAS_NAME_1: 'vehicle_code',
      MADDON_FILTER_OPERATOR_1: '=',
      MADDON_FILTER_JOINER_1: 'AND',
      MADDON_FILTER_SEQNUM_1: 1,
      MADDON_FILTER_VALUE_1: code,
    };
    return this.eam.getGridData<Vehicle[]>(params).pipe(
      map((vehicles: any[]) => vehicles.length > 0 ? vehicles[0] : null)
    );
  }
}

// ============================================================
// PositionApiService — Consulta Posiciones desde EAM
// ============================================================

@Injectable({ providedIn: 'root' })
export class PositionApiService {
  constructor(private eam: EamAdapter) {}

  // Posiciones de un vehículo
  getPositionsByVehicle(vehicleCode: string, dataspyId: string): Observable<Position[]> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'POSITIONS',
      USER_FUNCTION_NAME: 'POSITIONS',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
      MADDON_FILTER_ALIAS_NAME_1: 'vehicle_code',
      MADDON_FILTER_OPERATOR_1: '=',
      MADDON_FILTER_JOINER_1: 'AND',
      MADDON_FILTER_SEQNUM_1: 1,
      MADDON_FILTER_VALUE_1: vehicleCode,
    };
    return this.eam.getGridData<Position[]>(params);
  }
}

// ============================================================
// TireApiService — Consulta Neumáticos desde EAM
// ============================================================

@Injectable({ providedIn: 'root' })
export class TireApiService {
  constructor(private eam: EamAdapter) {}

  // Todos los neumáticos
  getAllTires(dataspyId: string): Observable<Tire[]> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'TIRES',
      USER_FUNCTION_NAME: 'TIRES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
    };
    return this.eam.getGridData<Tire[]>(params);
  }

  // Neumáticos en almacen (no montados)
  getStoreTires(dataspyId: string): Observable<Tire[]> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'TIRES',
      USER_FUNCTION_NAME: 'TIRES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
      MADDON_FILTER_ALIAS_NAME_1: 'status',
      MADDON_FILTER_OPERATOR_1: '=',
      MADDON_FILTER_JOINER_1: 'AND',
      MADDON_FILTER_SEQNUM_1: 1,
      MADDON_FILTER_VALUE_1: 'STORE',
    };
    return this.eam.getGridData<Tire[]>(params);
  }

  // Neumático por código
  getTireByCode(code: string, dataspyId: string): Observable<Tire | null> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'TIRES',
      USER_FUNCTION_NAME: 'TIRES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
      MADDON_FILTER_ALIAS_NAME_1: 'tire_code',
      MADDON_FILTER_OPERATOR_1: '=',
      MADDON_FILTER_JOINER_1: 'AND',
      MADDON_FILTER_SEQNUM_1: 1,
      MADDON_FILTER_VALUE_1: code,
    };
    return this.eam.getGridData<Tire[]>(params).pipe(
      map((tires: any[]) => tires.length > 0 ? tires[0] : null)
    );
  }
}

// ============================================================
// MovementApiService — Consulta Movimientos desde EAM
// ============================================================

@Injectable({ providedIn: 'root' })
export class MovementApiService {
  constructor(private eam: EamAdapter) {}

  // Historial de movimientos de un neumático
  getTireMovements(tireCode: string, dataspyId: string): Observable<any[]> {
    const params: GridQueryParams = {
      SYSTEM_FUNCTION_NAME: 'TIREMOVES',
      USER_FUNCTION_NAME: 'TIREMOVES',
      CURRENT_TAB_NAME: 'LST',
      DATASPY_ID: dataspyId,
      MADDON_FILTER_ALIAS_NAME_1: 'tire_code',
      MADDON_FILTER_OPERATOR_1: '=',
      MADDON_FILTER_JOINER_1: 'AND',
      MADDON_FILTER_SEQNUM_1: 1,
      MADDON_FILTER_VALUE_1: tireCode,
      ADDON_SORT_ELEMENT_ALIAS_NAME: 'move_date',
      ADDON_SORT_ELEMENT_TYPE: 'DESC',
    };
    return this.eam.getGridData(params);
  }
}