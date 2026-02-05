import useDashboardUserHistory from "@/hooks/useDashboardUserHistory.tsx";
import type { PaymentOfUser } from "@/interfaces/dashboardUserInterfaces.ts";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, XCircle, Clock, ClipboardList, Loader, Scroll, Calendar, DollarSign, Hash } from "lucide-react";
import { useSettings } from "@/hooks/useSettings.tsx";
import Modal from "@/components/Modal.tsx";
import { useEffect, useState } from "react";


import PaymentInfoItem from './PaymentInfoItem';
import { User, Mail, Phone } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function DashboardUserHistory() {
    const {
        paymentsOfUser,
        loading,
        // showModal,
        // setShowModal,
        // setIdPayment,
        showImageModal,
        setShowImageModal,
        isZoomed,
        setIsZoomed,
    } = useDashboardUserHistory();

    const [openInitialModal, setOpenInitialModal] = useState(false);
    const { paymentId } = useParams();

    console.log('paymentId',paymentId)
    console.log('paymentsOfUser',paymentsOfUser)
    const { allSettings } = useSettings();
    console.log('allSettings',allSettings)
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentOfUser | undefined>(undefined);

    useEffect(() => {
        if (paymentId && paymentsOfUser) {
            const payment = paymentsOfUser.find((payment) => payment.id === Number(paymentId));
            if (payment) {
                setSelectedPayment(payment);
                setOpenInitialModal(true);
            }
        }
    }, [paymentId, paymentsOfUser]);
    return (
        <>

            {
                loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )
            }
            <AnimatePresence>
                {
                    (showPaymentDetails || openInitialModal) && selectedPayment && (
                        <Modal 
                            setShowModal={(show) => {
                                if (!show) {
                                    setOpenInitialModal(false);
                                    setShowPaymentDetails(false);
                                    // Opcional: limpiar el parámetro de la URL
                                    window.history.replaceState({}, document.title, '/user/payment-history');
                                }
                            }} 
                            title={'Detalles del pago'}
                        >
                            <div className="space-y-3 flex flex-col w-full overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-5">
                                    <PaymentInfoItem
                                        icon={User}
                                        label="Nombre"
                                        value={selectedPayment.client_name ? selectedPayment.client_name : 'Sin nombre'}
                                    />

                                    <PaymentInfoItem
                                        icon={Mail}
                                        label="Email"
                                        value={selectedPayment.client_email ? selectedPayment.client_email : 'Sin email'}
                                    />

                                    <PaymentInfoItem
                                        icon={Phone}
                                        label="Teléfono"
                                        value={selectedPayment.client_phone ? selectedPayment.client_phone : 'Sin teléfono'}
                                    />

                                    <PaymentInfoItem
                                        icon={DollarSign}
                                        label="Monto"
                                        value={selectedPayment.amount ? `${selectedPayment.amount} ${selectedPayment.currency}` : 'Sin monto'}
                                    />

                                    <PaymentInfoItem
                                        icon={Hash}
                                        label="Referencia"
                                        value={selectedPayment.reference ? selectedPayment.reference : 'Sin referencia'}
                                        className={'break-all'}

                                    />

                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Fecha de la Transacción"
                                        value={selectedPayment.transactionDate ? new Date(selectedPayment.transactionDate).toLocaleDateString() : 'Sin fecha'}
                                    />

                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Notas"
                                        value={selectedPayment.notes ? selectedPayment.notes : 'Sin notas'}
                                    />
                                    <div>
                                        <p className="text-sm dark:text-gray-100 text-gray-700 flex items-center gap-2 mb-2">
                                            <Scroll className="w-4 h-4 text-[#bd9554]" />
                                            <strong>Estado del pago:</strong>
                                        </p>
                                        <span
                                            className={`px-4 flex items-center py-1 w-30 ml-6 h-8 flex justify-start items-center text-center text-sm font-medium rounded-full ${selectedPayment.status === "pendiente"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : selectedPayment.status === "completado"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {selectedPayment.status === "pendiente" ? (
                                                <Clock className="w-4 h-4 inline mr-1" />
                                            ) : selectedPayment.status === "completado" ? (
                                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                            ) : (
                                                <XCircle className="w-4 h-4 inline mr-1" />
                                            )}
                                            <span className="mb-[1px]">{selectedPayment.status}</span>
                                        </span>
                                    </div>
                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Fecha de cita"
                                        value={new Date(selectedPayment.Appointment.day).toLocaleDateString() || 'Sin fecha'}
                                    />
                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Hora de cita"
                                        value={selectedPayment.Appointment.start_time && selectedPayment.Appointment.end_time ? ` ${selectedPayment.Appointment.start_time} - ${selectedPayment.Appointment.end_time}` : 'Sin hora'}
                                    />
                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Estado de la cita"
                                        value={selectedPayment.Appointment.status ? selectedPayment.Appointment.status : 'Sin estado'}
                                    />
                                    <PaymentInfoItem
                                        icon={Calendar}
                                        label="Metodo de pago"
                                        value={selectedPayment.PaymentMethod?.name ? selectedPayment.PaymentMethod.name : 'Sin metodo de pago'}
                                    />
                                </div>
                                {selectedPayment?.PaymentImages?.[0]?.file_path && (
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
                        </Modal>
                    )
                }
            </AnimatePresence>
            <AnimatePresence>
                {showImageModal && (
                    <Modal
                        setShowModal={setShowImageModal}
                        title="Comprobante de Pago"
                    >
                        <motion.div
                            className="bg-white max-w-200 max-h-130 rounded-lg p-6 w-auto relative flex flex-col items-center cursor-zoom-in"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={`${
                                    import.meta.env
                                        .VITE_BASE_URL_IMAGES
                                }${
                                    selectedPayment
                                        ?.PaymentImages?.[0]
                                        .file_path
                                }`}
                                alt="Comprobante de pago grande"
                                className={`rounded max-h-full transition-transform duration-300 cursor-zoom-in ${
                                    isZoomed
                                        ? "scale-150 z-10"
                                        : "scale-100"
                                }`}
                                onClick={() =>
                                    setIsZoomed(!isZoomed)
                                }
                            />
                        </motion.div>
                    </Modal>
                )}
            </AnimatePresence>
            <div>
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Historial de pagos</h1>
                    <p className="text-gray-500 dark:text-gray-400">A continuación, encontrarás una lista de tus pagos realizados.</p>
                </div>
                {(paymentsOfUser === null || paymentsOfUser.length === 0) ? (
                    <div className="w-full text-center pt-30 flex flex-col justify-center items-center">
                        <div className="p-5 rounded-full mb-5 bg-gray-200/50 ">
                            <ClipboardList className="w-8 h-8 inline-block" />
                        </div>
                        <p className="text-lg font-semibold mb-2">No tienes pagos realizados.</p>
                        <p className="text-sm text-gray-400">Realiza un pago en la sección de pagos de la <Link to="/" className="text-blue-500 hover:underline">pagina principal</Link>.</p>
                    </div>
                ) : (
                    <div
                        className="flex flex-col gap-2 items-start justify-start content-center w-full min-h-screen">
                        {paymentsOfUser?.map((payment: PaymentOfUser) => (
                            <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 px-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 w-full"
                            >
                                <div className="flex justify-between space-x-2 items-center mb-2">
                                    <h3 className="text-lg truncate font-semibold text-gray-800 dark:text-white">
                                        {payment.client_name.slice(0, 25)}
                                    </h3>

                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2 flex gap-4">
                                    <div>
                                        <p>
                                            <strong>Monto:</strong> {payment.amount} {payment.currency}
                                        </p>
                                        <p className="truncate">
                                            <strong>Referencia:</strong> <span
                                            >{payment.reference}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p>
                                            <strong>Fecha pago:</strong>{" "}
                                            {new Date(payment.transactionDate).toLocaleDateString()}
                                        </p>
                                        <p>
                                            <strong>Metodo de pago:</strong>{" "}
                                            {payment.PaymentMethod?.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">

                                    <motion.button
                                        initial={{ opacity: 0, scale: 1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-[200px] cursor-pointer"
                                        onClick={() => {
                                            setShowPaymentDetails(true);
                                            setSelectedPayment(payment);
                                        }}
                                    >
                                        Ver Detalles
                                    </motion.button>
                                    <div className="flex gap-2">
                                        <span
                                            className={`px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center ${payment.status === "pendiente"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : payment.status === "completado"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            {
                                                payment.status === "pendiente" ? (
                                                    <Loader className="w-4 h-4 inline mr-1" />
                                                ) : payment.status === "completado" ? (
                                                    <CheckCircle className="w-4 h-4 inline mr-1" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 inline mr-1" />
                                                )
                                            }
                                            Pago: {payment.status}
                                        </span>
                                        {/* <span
                                            className={`px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center ${payment.status === "pendiente"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : appointmentIsCompleted(payment)
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            <Clock className="w-4 h-4 inline mr-1" />

                                            Cita: {appointmentIsCompleted(payment) ? "Completada" : "Pendiente"}
                                        </span> */}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )
                }
            </div>
        </>
    )
}
