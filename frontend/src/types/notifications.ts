export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'other';

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: NotificationType;
  seen: boolean;
  user_id: number;
  modalBody: string;
  payment_id: number | null;
  PaymentsAppointments:{
    amount: string;
    appointment_id: number;
    client_email: string;
    client_name: string;
    client_phone: string;
    createdAt: string;
    currency: string;
    id: number;
    is_approved: boolean | null;
    notes: string;
    paymentMethodId: number;
    reference: string;
    status: string;
    transactionDate: string;
    updatedAt: string;
  }
  createdAt: Date;
  updatedAt: Date;
}

