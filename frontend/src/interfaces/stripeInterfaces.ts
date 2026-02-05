export interface PaymentAppointmentStripe {
    amount: string;
    appointment_id: number;
    client_email: string;
    client_name: string;
    client_phone: string | null;
    createdAt: string;
    currency: string;
    id: number;
    is_approved: boolean;
    notes: string | null;
    paymentMethodId: number;
    payment_method_id: number | null;
    reference: string;
    status: string;
    transactionDate: string;
    updatedAt: string;
    user_id: number;
}

export interface StripePaymentsResponse {
    status: string;
    paymentsAppointments: PaymentAppointmentStripe[];
}