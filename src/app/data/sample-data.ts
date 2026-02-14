import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';

export const WORK_CENTERS: WorkCenterDocument[] = [
  {
    docId: 'wc-001',
    docType: 'workCenter',
    data: { name: 'Genesis Hardware' }
  },
  {
    docId: 'wc-002',
    docType: 'workCenter',
    data: { name: 'Rodriques Electrics' }
  },
  {
    docId: 'wc-003',
    docType: 'workCenter',
    data: { name: 'Konsulting Inc' }
  },
  {
    docId: 'wc-004',
    docType: 'workCenter',
    data: { name: 'McMarrow Distribution' }
  },
  {
    docId: 'wc-005',
    docType: 'workCenter',
    data: { name: 'Spartan Manufacturing' }
  }
];

// Helper to get dates relative to today for demo purposes
const today = new Date();
const formatDate = (date: Date): string => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const WORK_ORDERS: WorkOrderDocument[] = [
  {
    docId: 'wo-001',
    docType: 'workOrder',
    data: {
      name: 'Consulting Inc',
      workCenterId: 'wc-001',
      status: 'complete',
      startDate: formatDate(addDays(today, -45)),
      endDate: formatDate(addDays(today, -15))
    }
  },
  {
    docId: 'wo-002',
    docType: 'workOrder',
    data: {
      name: 'Rodriques Electrics',
      workCenterId: 'wc-002',
      status: 'in-progress',
      startDate: formatDate(addDays(today, -30)),
      endDate: formatDate(addDays(today, 15))
    }
  },
  {
    docId: 'wo-003',
    docType: 'workOrder',
    data: {
      name: 'Konsulting Inc',
      workCenterId: 'wc-003',
      status: 'in-progress',
      startDate: formatDate(addDays(today, -20)),
      endDate: formatDate(addDays(today, 25))
    }
  },
  {
    docId: 'wo-004',
    docType: 'workOrder',
    data: {
      name: 'Compleks Systems',
      workCenterId: 'wc-003',
      status: 'in-progress',
      startDate: formatDate(addDays(today, 30)),
      endDate: formatDate(addDays(today, 75))
    }
  },
  {
    docId: 'wo-005',
    docType: 'workOrder',
    data: {
      name: 'McMarrow Distribution',
      workCenterId: 'wc-004',
      status: 'blocked',
      startDate: formatDate(addDays(today, -10)),
      endDate: formatDate(addDays(today, 45))
    }
  },
  {
    docId: 'wo-006',
    docType: 'workOrder',
    data: {
      name: 'Assembly Line Alpha',
      workCenterId: 'wc-005',
      status: 'open',
      startDate: formatDate(addDays(today, 5)),
      endDate: formatDate(addDays(today, 20))
    }
  },
  {
    docId: 'wo-007',
    docType: 'workOrder',
    data: {
      name: 'Quality Check Batch',
      workCenterId: 'wc-005',
      status: 'complete',
      startDate: formatDate(addDays(today, -60)),
      endDate: formatDate(addDays(today, -40))
    }
  },
  {
    docId: 'wo-008',
    docType: 'workOrder',
    data: {
      name: 'Maintenance Schedule',
      workCenterId: 'wc-001',
      status: 'open',
      startDate: formatDate(addDays(today, 10)),
      endDate: formatDate(addDays(today, 25))
    }
  }
];
