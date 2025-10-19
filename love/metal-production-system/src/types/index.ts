export interface Order {
  manager: string;
  orderNumber: string;
  operationType: string;
  shipmentDate: string;
  cuttingTime: number;
  cuttingStatus: string;
  cleaningTime: number;
  cleaningStatus: string;
  bendingTime: number;
  bendingStatus: string;
  weldingTime: number;
  weldingStatus: string;
  paintingTime: number;
  paintingStatus: string;
  warehouse75Time: number;
  warehouse75Status: string;
  warehouseTime: number;
  warehouseStatus: string;
  overallStatus: string;
}

export interface CompletedOrder {
  id: string;
  order_number: string;
  manager: string | null;
  laser_time: number;
  cleaning_time: number;
  bending_time: number;
  welding_time: number;
  painting_time: number;
  warehouse75_time: number;
  warehouse_time: number;
  total_time: number;
  completed_at: string;
  created_at: string;
}

export interface LogisticsEntry {
  id: string;
  order_number: string;
  manager: string | null;
  moved_to: string;
  moved_by: string;
  created_at: string;
}

export interface ProblemEntry {
  id: string;
  order_number: string;
  manager: string | null;
  description: string;
  reported_by: string;
  created_at: string;
  resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

export interface User {
  firstName: string;
  lastName: string;
  fullName: string;
}
