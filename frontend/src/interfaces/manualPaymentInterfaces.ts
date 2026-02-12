export interface ExternalPayment {
	id: number;
	user_id: number;
	appointment_id: number;
	paymentMethodId: number;
	payment_method_id: number;
	amount: string;
	client_email: string;
	client_name: string;
	client_phone: string;
	created_at: string; // ISO date string
	updated_at: string; // ISO date string
	currency: string;
	is_approved: boolean | null;
	notes: string;
	reference: string;
	status: string;
	transactionDate: string; // ISO date string
	PaymentImages?: any[];
}

export interface ManualImagePayment{
    createdAt
        :
        string
    file_name
        :
        string
    file_path
        :
       string
    id
        :
        number
    is_active
        :
        boolean
    payment_id
        :
        number
    updatedAt
        :
        string
}
export interface ManualPaymentByIdInterface{
    paymentAppointment
        : ExternalPayment,
    PaymentImages
        : ManualImagePayment[]
}
export interface ManualPaymentResponseInterface {
    status: string;
    data: ExternalPayment[];
}
