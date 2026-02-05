import React from 'react'
import { Calendar, CheckCircle, Clock, DollarSign, Hash, Mail, Phone, Scroll, User, XCircle } from "lucide-react";
import Modal from "@/components/Modal.tsx";
import type { ManualPaymentByIdInterface } from "@/interfaces/manualPaymentInterfaces.ts";
import PaymentInfoItem from './PaymentInfoItem';

interface ModalOfManualPaymentToSeeDetailsProps {
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    infoOfManualPaymentById: ManualPaymentByIdInterface | null;
    setShowImageModal?: React.Dispatch<React.SetStateAction<boolean>> | boolean;
    setNewStatusOfManualPayment: (status: string) => void;
    buttonsActionsOfVerifyPayment: {
        label: string;
        value: string;
        style: string;
        icon: React.ReactNode;
    }[];
}

export default function ModalOfManualPaymentToSeeDetails({
    setShowModal,
    infoOfManualPaymentById,
    setNewStatusOfManualPayment,
    setShowImageModal,
    buttonsActionsOfVerifyPayment
}: ModalOfManualPaymentToSeeDetailsProps) {
    return (
        <Modal setShowModal={setShowModal} title="Detalles del Pago">
            {infoOfManualPaymentById ? (
                <div className="space-y-3 flex flex-col w-full min-h-110 overflow-y-scroll">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-auto">
                        <PaymentInfoItem
                            icon={User}
                            label="Nombre del Cliente"
                            value={infoOfManualPaymentById.paymentAppointment.client_name}
                        />

                        <PaymentInfoItem
                            icon={Mail}
                            label="Email del Cliente"
                            value={infoOfManualPaymentById.paymentAppointment.client_email}
                        />

                        <PaymentInfoItem
                            icon={Phone}
                            label="Teléfono del Cliente"
                            value={infoOfManualPaymentById.paymentAppointment.client_phone}
                        />

                        <PaymentInfoItem
                            icon={DollarSign}
                            label="Monto"
                            value={`${infoOfManualPaymentById.paymentAppointment.amount} ${infoOfManualPaymentById.paymentAppointment.currency}`}
                        />

                        <PaymentInfoItem
                            icon={Hash}
                            label="Referencia"
                            value={infoOfManualPaymentById.paymentAppointment.reference}
                            className={'break-all'}

                        />

                        <PaymentInfoItem
                            icon={Calendar}
                            label="Fecha de la Transacción"
                            value={new Date(infoOfManualPaymentById.paymentAppointment.transactionDate).toLocaleDateString()}
                        />

                        <PaymentInfoItem
                            icon={Calendar}
                            label="Notas"
                            value={infoOfManualPaymentById.paymentAppointment.notes || 'Sin notas'}
                        />
                        <div>
                            <p className="text-sm dark:text-gray-100 text-gray-700 flex items-center gap-2">
                                <Scroll className="w-4 h-4 text-[#bd9554]" />
                                <strong>Estado:</strong>
                            </p>
                            <span
                                className={`px-4 flex items-center py-1 w-30 mx-auto h-8 flex justify-center items-center text-center text-sm font-medium rounded-full ${infoOfManualPaymentById.paymentAppointment.status === "pendiente"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : infoOfManualPaymentById.paymentAppointment.status === "completado"
                                        ? "bg-green-100 text-green-600"
                                        : "bg-red-100 text-red-600"
                                    }`}
                            >
                                {infoOfManualPaymentById.paymentAppointment.status === "pendiente" ? (
                                    <Clock className="w-4 h-4 inline mr-1" />
                                ) : infoOfManualPaymentById.paymentAppointment.status === "completado" ? (
                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                ) : (
                                    <XCircle className="w-4 h-4 inline mr-1" />
                                )}
                                {infoOfManualPaymentById.paymentAppointment.status}
                            </span>
                        </div>
                    </div>
                    <div className='w-full'>
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                            Cambiar Estado:
                        </p>
                        <div className='flex items-center justify-around gap-2'>
                            {buttonsActionsOfVerifyPayment.filter(b => b.value !== infoOfManualPaymentById.paymentAppointment.status).map((button) => (
                                <button
                                    key={button.value}
                                    className={`px-3 flex gap-2 items-center justify-center py-2 ${button.style} text-white rounded hover:opacity-90 transition-colors w-full cursor-pointer hover:shadow-xl transition-shadow shadow-sm`}
                                    onClick={() => setNewStatusOfManualPayment(button.value)}
                                >
                                    {button.icon}
                                    {button.label}
                                </button>
                            ))
                            }
                        </div>

                    </div>
                    {/* <hr className='text-gray-200' /> */}
                    {infoOfManualPaymentById.imageOfPayment?.[0]?.file_path && (
                        <div className="w-full flex flex-col items-center">

                            <button
                                className="px-3 py-1 w-full h-10 bg-gray-800 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors cursor-pointer hover:shadow-xl transition-shadow shadow-sm"
                                onClick={() => typeof setShowImageModal === "function" && setShowImageModal(true)}
                            >
                                Ver imagen
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-center text-gray-500">Cargando detalles...</p>
            )}
        </Modal>
    )
}
