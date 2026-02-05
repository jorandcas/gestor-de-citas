import React from 'react'
import { Calendar, CheckCircle, Clock, DollarSign, Hash, Mail, Phone, Scroll, User, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";
import Modal from "@/components/Modal.tsx";
import PaymentInfoItem from './PaymentInfoItem';
import type { PaymentAppointmentStripe } from "@/interfaces/stripeInterfaces.ts";

interface ModalOfManualPaymentToSeeDetailsProps {
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    infoOfPaypalPaymentById: PaymentAppointmentStripe | null;
    setNewStatusOfPaypalPayment: (status: string) => void;
    buttonsActionsOfVerifyPayment: {
        label: string;
        value: string;
        style: string;
        icon: React.ReactNode;
    }[];
    handleSubmitChangeStatusOfManualPayment: (id: number) => Promise<void>
    className?: string
}

export default function ModalOfPaypalPaymentToSeeDetails({
    className,
    setShowModal,
    infoOfPaypalPaymentById,
    setNewStatusOfPaypalPayment,
    buttonsActionsOfVerifyPayment,
    handleSubmitChangeStatusOfManualPayment
    
}: ModalOfManualPaymentToSeeDetailsProps) {
    return (
        <Modal setShowModal={setShowModal} title="Detalles del Pago" className={className}>
            {infoOfPaypalPaymentById ? (
                <div className="space-y-3 flex flex-col w-full h-110 overflow-y-scroll">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-auto">
                        <PaymentInfoItem
                            icon={User}
                            label="Nombre del Cliente"
                            value={infoOfPaypalPaymentById.client_name}
                        />

                        <PaymentInfoItem
                            icon={Mail}
                            label="Email del Cliente"
                            value={infoOfPaypalPaymentById.client_email}
                        />

                        <PaymentInfoItem
                            icon={Phone}
                            label="Teléfono del Cliente"
                            value={infoOfPaypalPaymentById.client_phone}
                        />

                        <PaymentInfoItem
                            icon={DollarSign}
                            label="Monto"
                            value={`${infoOfPaypalPaymentById.amount} ${infoOfPaypalPaymentById.currency}`}
                        />

                        <PaymentInfoItem
                            icon={Hash}
                            label="Referencia"
                            value={infoOfPaypalPaymentById.reference}
                            className={'break-all'}
                        />

                        <PaymentInfoItem
                            icon={Calendar}
                            label="Fecha de la Transacción"
                            value={new Date(infoOfPaypalPaymentById.transactionDate).toLocaleDateString()}
                        />

                        <PaymentInfoItem
                            icon={Calendar}
                            label="Notas"
                            value={infoOfPaypalPaymentById.notes || 'Sin notas'}
                        />
                        <div>
                            <p className="text-sm dark:text-gray-100 text-gray-700 flex items-center gap-2">
                                <Scroll className="w-4 h-4 text-[#bd9554]" />
                                <strong>Estado:</strong>
                            </p>
                            <span
                                className={twMerge(
                                    "px-4 flex py-1 w-30 ml-6 mt-1 h-8 justify-center items-center text-center text-sm font-medium rounded-full",
                                    infoOfPaypalPaymentById.status === "reembolsado" && "bg-orange-100 text-orange-600",
                                    infoOfPaypalPaymentById.status === "reembolso" && "bg-purple-100 text-purple-600",
                                    infoOfPaypalPaymentById.status === "pendiente" && "bg-yellow-100 text-yellow-600",
                                    infoOfPaypalPaymentById.status === "completado" && "bg-green-100 text-green-600",
                                    !["reembolsado", "reembolso", "pendiente", "completado"].includes(infoOfPaypalPaymentById.status) && "bg-red-100 text-red-600"
                                )}
                            >
                                {infoOfPaypalPaymentById.status === "pendiente" ? (
                                    <Clock className="w-4 h-4 inline mr-1" />
                                ) : infoOfPaypalPaymentById.status === "completado" ? (
                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                ) : infoOfPaypalPaymentById.status === "reembolsado" ? (
                                    <XCircle className="w-4 h-4 inline mr-1" />
                                ) : infoOfPaypalPaymentById.status === "reembolso" ? (
                                    <Clock className="w-4 h-4 inline mr-1" />
                                ) : (
                                    <XCircle className="w-4 h-4 inline mr-1" />
                                )}
                                {infoOfPaypalPaymentById.status}
                            </span>
                        </div>
                    </div>
                    <div className='w-full'>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Cambiar Estado:
                        </p>
                        <div className='flex items-center justify-around gap-2'>
                            {buttonsActionsOfVerifyPayment.filter(b => b.value !== infoOfPaypalPaymentById.status).map((button) => (
                                <button
                                    key={button.value}
                                    className={`px-3 flex gap-2 items-center justify-center py-2 ${button.style} text-white rounded hover:opacity-90 transition-colors w-full`}
                                    onClick={() => (
                                        setNewStatusOfPaypalPayment(button.value),
                                        handleSubmitChangeStatusOfManualPayment(infoOfPaypalPaymentById.id)
                                    )}
                                >
                                    {button.icon}
                                    {button.label}
                                </button>
                            ))
                            }
                        </div>

                    </div>

                </div>
            ) : (
                <p className="text-center text-gray-500">Cargando detalles...</p>
            )}
        </Modal>
    )
}
