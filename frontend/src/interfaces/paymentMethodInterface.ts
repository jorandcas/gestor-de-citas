export interface PaymentMethod {
    id: number;
    name: string;
    description: string;
    is_active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentMethodResponseInterface {
    data: PaymentMethod[];
    status: string;
}