import { Injectable } from '@angular/core';
import { Observable, from, EMPTY } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

declare const EAM: any;

// ============================================================
// EamAdapter — Bridge entre EAM ExtJS y Angular RxJS
// ============================================================
// Traduce EAM.Ajax.request() (callback-based, sync/async mix)
// a Observables RxJS para usar con Angular.
// La key es que EAM.Ajax.request() tiene async: false,
// así que podemos envolverlo en un Promise/Observable.

export interface GridMetadata {
  CLIENTROWS: number;
  CURRENTCURSORPOSITION: number;
  MORERECORDPRESENT: '+' | '-';
}

export interface GridResult {
  DATA: any[];
  METADATA: GridMetadata;
}

// Respuesta paginada de getGridData
export interface GridResponse<T = any[]> {
  data: T;
  metadata: GridMetadata;
}

// ---------- Filter Operators ----------
export type FilterOperator =
  | '='
  | '!='
  | '>'
  | '<'
  | '>='
  | '<='
  | 'LIKE'
  | 'NOT LIKE'
  | 'IS EMPTY'
  | 'NOT EMPTY'
  | 'IN'
  | 'NOT IN';

export type FilterJoiner = 'AND' | 'OR';

// ---------- Query Params para GRID ----------
export interface GridQueryParams {
  SYSTEM_FUNCTION_NAME: string;
  USER_FUNCTION_NAME: string;
  CURRENT_TAB_NAME: string;
  DATASPY_ID: string;
  // Filters opcionales
  MADDON_FILTER_ALIAS_NAME_1?: string;
  MADDON_FILTER_OPERATOR_1?: string;
  MADDON_FILTER_JOINER_1?: FilterJoiner;
  MADDON_FILTER_SEQNUM_1?: number;
  MADDON_FILTER_VALUE_1?: string;
  MADDON_FILTER_ALIAS_NAME_2?: string;
  MADDON_FILTER_OPERATOR_2?: string;
  MADDON_FILTER_JOINER_2?: FilterJoiner;
  MADDON_FILTER_SEQNUM_2?: number;
  MADDON_FILTER_VALUE_2?: string;
  MADDON_FILTER_ALIAS_NAME_3?: string;
  MADDON_FILTER_OPERATOR_3?: string;
  MADDON_FILTER_JOINER_3?: FilterJoiner;
  MADDON_FILTER_SEQNUM_3?: number;
  MADDON_FILTER_VALUE_3?: string;
  // Sorting
  ADDON_SORT_ELEMENT_ALIAS_NAME?: string;
  ADDON_SORT_ELEMENT_TYPE?: 'ASC' | 'DESC';
}

@Injectable({ providedIn: 'root' })
export class EamAdapter {
  // ============================================================
  // getGridData — Implementación del patrón de paginación
  // Extrae filas del cursor hasta que MORERECORDPRESENT = '-'
  // ============================================================
  getGridData<T = any[]>(paramsQuery: GridQueryParams): Observable<T> {
    return new Observable<T>(observer => {
      let vGridDataList: any[] = [];
      let vClientRows = 0;
      let vCurrentCursorPosition = 0;
      let vMoreRecordsPresent = '+';
      let i = 0;

      // --- Primera llamada: GRIDDATA ---
      const firstCall = () => {
        EAM.Ajax.request({
          url: 'GRIDDATA',
          params: {
            SYSTEM_FUNCTION_NAME: paramsQuery.SYSTEM_FUNCTION_NAME,
            USER_FUNCTION_NAME: paramsQuery.USER_FUNCTION_NAME,
            CURRENT_TAB_NAME: paramsQuery.CURRENT_TAB_NAME,
            COMPONENT_INFO_TYPE: 'DATA_ONLY',
            DATASPY_ID: paramsQuery.DATASPY_ID,
            REQUEST_TYPE: 'LIST.HEAD_DATA.STORED',
            GRID_NAME: paramsQuery.SYSTEM_FUNCTION_NAME,
            // Filters
            MADDON_FILTER_ALIAS_NAME_1: paramsQuery.MADDON_FILTER_ALIAS_NAME_1,
            MADDON_FILTER_OPERATOR_1: paramsQuery.MADDON_FILTER_OPERATOR_1,
            MADDON_FILTER_JOINER_1: paramsQuery.MADDON_FILTER_JOINER_1,
            MADDON_FILTER_SEQNUM_1: paramsQuery.MADDON_FILTER_SEQNUM_1,
            MADDON_FILTER_VALUE_1: paramsQuery.MADDON_FILTER_VALUE_1,
            MADDON_FILTER_ALIAS_NAME_2: paramsQuery.MADDON_FILTER_ALIAS_NAME_2,
            MADDON_FILTER_OPERATOR_2: paramsQuery.MADDON_FILTER_OPERATOR_2,
            MADDON_FILTER_JOINER_2: paramsQuery.MADDON_FILTER_JOINER_2,
            MADDON_FILTER_SEQNUM_2: paramsQuery.MADDON_FILTER_SEQNUM_2,
            MADDON_FILTER_VALUE_2: paramsQuery.MADDON_FILTER_VALUE_2,
            MADDON_FILTER_ALIAS_NAME_3: paramsQuery.MADDON_FILTER_ALIAS_NAME_3,
            MADDON_FILTER_OPERATOR_3: paramsQuery.MADDON_FILTER_OPERATOR_3,
            MADDON_FILTER_JOINER_3: paramsQuery.MADDON_FILTER_JOINER_3,
            MADDON_FILTER_SEQNUM_3: paramsQuery.MADDON_FILTER_SEQNUM_3,
            MADDON_FILTER_VALUE_3: paramsQuery.MADDON_FILTER_VALUE_3,
            ADDON_SORT_ELEMENT_ALIAS_NAME: paramsQuery.ADDON_SORT_ELEMENT_ALIAS_NAME,
            ADDON_SORT_ELEMENT_TYPE: paramsQuery.ADDON_SORT_ELEMENT_TYPE,
            GET_ALL_DATABSE_ROWS: true,
            GET_LAST_CACHED: false,
            CACHE_REQUEST: true,
            NUMBER_OF_ROWS_FIRST_RETURNED: 5000,
          },
          async: false,
          onSuccess: (vTrue: boolean, vResponseText: string, vList: any) => {
            if (vList?.pageData?.grid?.GRIDRESULT?.GRID?.DATA) {
              vGridDataList = vList.pageData.grid.GRIDRESULT.GRID.DATA;
              vClientRows = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CLIENTROWS;
              vCurrentCursorPosition = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CURRENTCURSORPOSITION;
              vMoreRecordsPresent = vList.pageData.grid.GRIDRESULT.GRID.METADATA.MORERECORDPRESENT;
              vCurrentCursorPosition = Number(vCurrentCursorPosition) + 1;
            }
          },
        });
      };

      // --- Loop de paginación: GETCACHE ---
      const fetchAllPages = () => {
        while (vMoreRecordsPresent === '+') {
          EAM.Ajax.request({
            url: 'GETCACHE',
            params: {
              SYSTEM_FUNCTION_NAME: paramsQuery.SYSTEM_FUNCTION_NAME,
              USER_FUNCTION_NAME: paramsQuery.USER_FUNCTION_NAME,
              COMPONENT_INFO_TYPE: 'DATA_ONLY',
              COMPONENT_INFO_TYPE_MODE: 'CACHE',
              DATASPY_ID: paramsQuery.DATASPY_ID,
              REQUEST_TYPE: 'LIST.HEAD_DATA.STORED',
              GRID_NAME: paramsQuery.SYSTEM_FUNCTION_NAME,
              CACHE_REQUEST: false,
              CURSOR_POSITION: vCurrentCursorPosition,
              NUMBER_OF_ROWS_FIRST_RETURNED: vClientRows,
              MADDON_FILTER_ALIAS_NAME_1: paramsQuery.MADDON_FILTER_ALIAS_NAME_1,
              MADDON_FILTER_OPERATOR_1: paramsQuery.MADDON_FILTER_OPERATOR_1,
              MADDON_FILTER_JOINER_1: paramsQuery.MADDON_FILTER_JOINER_1,
              MADDON_FILTER_SEQNUM_1: paramsQuery.MADDON_FILTER_SEQNUM_1,
              MADDON_FILTER_VALUE_1: paramsQuery.MADDON_FILTER_VALUE_1,
              MADDON_FILTER_ALIAS_NAME_2: paramsQuery.MADDON_FILTER_ALIAS_NAME_2,
              MADDON_FILTER_OPERATOR_2: paramsQuery.MADDON_FILTER_OPERATOR_2,
              MADDON_FILTER_JOINER_2: paramsQuery.MADDON_FILTER_JOINER_2,
              MADDON_FILTER_SEQNUM_2: paramsQuery.MADDON_FILTER_SEQNUM_2,
              MADDON_FILTER_VALUE_2: paramsQuery.MADDON_FILTER_VALUE_2,
              MADDON_FILTER_ALIAS_NAME_3: paramsQuery.MADDON_FILTER_ALIAS_NAME_3,
              MADDON_FILTER_OPERATOR_3: paramsQuery.MADDON_FILTER_OPERATOR_3,
              MADDON_FILTER_JOINER_3: paramsQuery.MADDON_FILTER_JOINER_3,
              MADDON_FILTER_SEQNUM_3: paramsQuery.MADDON_FILTER_SEQNUM_3,
              MADDON_FILTER_VALUE_3: paramsQuery.MADDON_FILTER_VALUE_3,
              USE_PAGING: true,
            },
            async: false,
            onSuccess: (vTrue: boolean, vResponseText: string, vList: any) => {
              if (vList?.pageData?.grid?.GRIDRESULT?.GRID?.DATA) {
                const vGridDataLength = vList.pageData.grid.GRIDRESULT.GRID.DATA.length;
                for (i = 0; i < vGridDataLength; i++) {
                  vGridDataList.push(vList.pageData.grid.GRIDRESULT.GRID.DATA[i]);
                }
                vClientRows = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CLIENTROWS;
                vCurrentCursorPosition = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CURRENTCURSORPOSITION;
                vMoreRecordsPresent = vList.pageData.grid.GRIDRESULT.GRID.METADATA.MORERECORDPRESENT;
                vCurrentCursorPosition = Number(vCurrentCursorPosition) + 1;
              }
            },
          });
        }
      };

      try {
        firstCall();
        fetchAllPages();
        observer.next(vGridDataList as T);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  // ============================================================
  // getFormData — Carga un registro de formulario (ej: WSJOBS.HDR)
  // ============================================================
  getFormData(
    systemFunctionName: string,
    keyField: string,
    keyValue: string
  ): Observable<any> {
    return new Observable(observer => {
      try {
        const result = EAM.Ajax.request({
          url: `${systemFunctionName}.HDR`,
          params: {
            SYSTEM_FUNCTION_NAME: systemFunctionName,
            USER_FUNCTION_NAME: systemFunctionName,
            CURRENT_TAB_NAME: 'HDR',
            CHECK_CF_CHANGEFLAG: true,
            [keyField]: keyValue,
            pagemode: 'view',
          },
          async: false,
          onSuccess: (vTrue: boolean, vResponseText: string, vList: any) => {
            if (vList?.responseData?.pageData?.values) {
              observer.next(vList.responseData.pageData.values);
            } else {
              observer.next(null);
            }
          },
        });

        // Si no hay onSuccess disparado
        if (!result?.responseData) {
          observer.next(null);
        }
      } catch (err) {
        observer.error(err);
      }
    });
  }

  // ============================================================
  // saveFormData — Guarda/actualiza un registro
  // ============================================================
  saveFormData(
    systemFunctionName: string,
    recordData: Record<string, any>
  ): Observable<boolean> {
    return new Observable(observer => {
      try {
        EAM.Ajax.request({
          url: `${systemFunctionName}.HDR?pageaction=SAVE`,
          params: {
            SYSTEM_FUNCTION_NAME: systemFunctionName,
            USER_FUNCTION_NAME: systemFunctionName,
            CURRENT_TAB_NAME: 'HDR',
            CHECK_CF_CHANGEFLAG: true,
            can_update: true,
            pagemode: 'view',
            ...recordData,
          },
          async: false,
          onSuccess: () => {
            observer.next(true);
            observer.complete();
          },
        });
        observer.next(true);
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }

  // ============================================================
  // getCurrentUser — Obtiene usuario logueado en EAM
  // ============================================================
  getCurrentUser(): Observable<{ userId: string; org: string }> {
    return new Observable(observer => {
      try {
        const screen = EAM.Utils.getScreen();
        observer.next({
          userId: screen?.userId || '',
          org: screen?.org || '',
        });
        observer.complete();
      } catch (err) {
        observer.error(err);
      }
    });
  }
}