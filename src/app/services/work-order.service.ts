import { Injectable, signal, computed } from '@angular/core';
import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument, WorkOrderStatus } from '../models/work-order.model';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';

const STORAGE_KEY_WORK_ORDERS = 'work-order-timeline-orders';
const STORAGE_KEY_WORK_CENTERS = 'work-order-timeline-centers';

@Injectable({
  providedIn: 'root'
})
export class WorkOrderService {
  private workCentersSignal = signal<WorkCenterDocument[]>([]);
  private workOrdersSignal = signal<WorkOrderDocument[]>([]);

  readonly workCenters = this.workCentersSignal.asReadonly();
  readonly workOrders = this.workOrdersSignal.asReadonly();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    // Try to load from localStorage first (bonus feature)
    const storedOrders = localStorage.getItem(STORAGE_KEY_WORK_ORDERS);
    const storedCenters = localStorage.getItem(STORAGE_KEY_WORK_CENTERS);

    if (storedOrders && storedCenters) {
      this.workOrdersSignal.set(JSON.parse(storedOrders));
      this.workCentersSignal.set(JSON.parse(storedCenters));
    } else {
      // Use sample data
      this.workCentersSignal.set([...WORK_CENTERS]);
      this.workOrdersSignal.set([...WORK_ORDERS]);
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY_WORK_ORDERS, JSON.stringify(this.workOrdersSignal()));
    localStorage.setItem(STORAGE_KEY_WORK_CENTERS, JSON.stringify(this.workCentersSignal()));
  }

  private generateId(): string {
    return 'wo-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getWorkOrdersForWorkCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrdersSignal().filter(wo => wo.data.workCenterId === workCenterId);
  }

  /**
   * Check if a new/edited work order would overlap with existing orders on the same work center
   * @param workCenterId - The work center to check
   * @param startDate - Start date of the order
   * @param endDate - End date of the order
   * @param excludeOrderId - Optional order ID to exclude (for edit mode)
   * @returns true if there's an overlap
   */
  checkOverlap(
    workCenterId: string,
    startDate: string,
    endDate: string,
    excludeOrderId?: string
  ): boolean {
    const orders = this.getWorkOrdersForWorkCenter(workCenterId)
      .filter(wo => wo.docId !== excludeOrderId);

    const newStart = new Date(startDate).getTime();
    const newEnd = new Date(endDate).getTime();

    return orders.some(order => {
      const orderStart = new Date(order.data.startDate).getTime();
      const orderEnd = new Date(order.data.endDate).getTime();
      // Overlap occurs if: newStart < orderEnd AND newEnd > orderStart
      return newStart < orderEnd && newEnd > orderStart;
    });
  }

  createWorkOrder(data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string;
    endDate: string;
  }): { success: boolean; error?: string } {
    // Validate overlap
    if (this.checkOverlap(data.workCenterId, data.startDate, data.endDate)) {
      return { success: false, error: 'Work order overlaps with an existing order on this work center' };
    }

    const newOrder: WorkOrderDocument = {
      docId: this.generateId(),
      docType: 'workOrder',
      data: { ...data }
    };

    this.workOrdersSignal.update(orders => [...orders, newOrder]);
    this.saveToStorage();
    return { success: true };
  }

  updateWorkOrder(
    docId: string,
    data: {
      name: string;
      workCenterId: string;
      status: WorkOrderStatus;
      startDate: string;
      endDate: string;
    }
  ): { success: boolean; error?: string } {
    // Validate overlap (excluding current order)
    if (this.checkOverlap(data.workCenterId, data.startDate, data.endDate, docId)) {
      return { success: false, error: 'Work order overlaps with an existing order on this work center' };
    }

    this.workOrdersSignal.update(orders =>
      orders.map(order =>
        order.docId === docId
          ? { ...order, data: { ...data } }
          : order
      )
    );
    this.saveToStorage();
    return { success: true };
  }

  deleteWorkOrder(docId: string): void {
    this.workOrdersSignal.update(orders => orders.filter(order => order.docId !== docId));
    this.saveToStorage();
  }

  getWorkOrderById(docId: string): WorkOrderDocument | undefined {
    return this.workOrdersSignal().find(order => order.docId === docId);
  }

  getWorkCenterById(docId: string): WorkCenterDocument | undefined {
    return this.workCentersSignal().find(center => center.docId === docId);
  }
}
