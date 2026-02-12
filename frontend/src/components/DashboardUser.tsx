import useDashboardUser from "@/hooks/useDashboardUser.tsx";
import type { PaymentOfUser } from "@/interfaces/dashboardUserInterfaces.ts";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, XCircle, Clock, ClipboardList, Loader } from "lucide-react";
import { useSettings } from "@/hooks/useSettings.tsx";
import Modal from "@/components/Modal.tsx";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardUser() {
    const {
        appointmentsOfUser,
        loading,
        handleCancelAppointment,
        showModal,
        setShowModal,
        handleChangePlatform,
        setIdAppointment
    } = useDashboardUser()
    const { allSettings, allMeetingPlatforms } = useSettings();
    const [showOlded, setShowOlded] = useState(false);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentOfUser | undefined>(undefined);
    // Crear fecha de la cita en la zona horaria local
    function isMoreThan8HoursFunc(payment: PaymentOfUser) {
        const appointmentDate = new Date(payment.Appointment.day);
        const [hours, minutes, seconds] = payment.Appointment.start_time.split(':').map(Number);
        appointmentDate.setHours(hours, minutes, seconds);

        // Obtener la fecha actual en la misma zona horaria
        const now = new Date();

        // Calcular la diferencia en milisegundos
        const diffMs = appointmentDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        // Verificar si faltan más de 8 horas para la cita
        const isMoreThan8Hours = diffHours > 8;

        return isMoreThan8Hours;
    }
    const appointmentsOlded = appointmentsOfUser?.paymentsOfUser.filter(payment => payment.Appointment.status === 'completado')
    console.log(appointmentsOlded)
    const newAppointments = appointmentsOfUser?.paymentsOfUser.filter(payment => payment.Appointment.status === 'reservado' || payment.Appointment.status === 'pendiente_pago')
    function appointmentIsCompleted(payment: PaymentOfUser) {
        const appointmentDate = new Date(payment.Appointment.day);
        const [hours, minutes, seconds] = payment.Appointment.end_time.split(':').map(Number);
        appointmentDate.setHours(hours, minutes, seconds);

        // Obtener la fecha actual en la misma zona horaria
        const now = new Date();

        // Verificar si la cita ya ha pasado
        return now > appointmentDate;
    }
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
                    showModal && (
                        <Modal setShowModal={setShowModal} priority={20} title={'Cambia la plataforma de Reunión'}>
                            <div className="w-full text-black">
                                {
                                    !allMeetingPlatforms?.MeetingPlatforms ? (
                                        <p>Cargando plataformas...</p>
                                    ) : allMeetingPlatforms?.MeetingPlatforms?.length === 0 ? (
                                        <p>No hay plataformas de reunión disponibles.</p>
                                    ) :
                                        allMeetingPlatforms.MeetingPlatforms.length > 0 ? (
                                            <div className="flex gap-4">
                                                {allMeetingPlatforms.MeetingPlatforms.filter(plat => plat.is_active === true).map((platform) => (
                                                    <motion.button 
                                                    initial={{ scale: 1 }}
                                                    whileHover={{scale:1.05}}
                                                    key={platform.id}
                                                        className="p-4 bg-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-700/80 dark:bg-gray-700 border-gray-200 dark:border-gray-600 border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
                                                        value={platform.id}
                                                        onClick={() => handleChangePlatform(platform.id)}>
                                                        <h3 className="text-lg text-gray-800 dark:text-gray-100 font-semibold mb-2">{platform.name}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-300/70 mb-4">{platform.description}</p>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p>No hay plataformas de reunión disponibles.</p>
                                        )
                                }
                            </div>
                        </Modal>
                    )
                }
            </AnimatePresence>
            <AnimatePresence>
                {
                    showPaymentDetails && selectedPayment !== undefined && (

                        <Modal setShowModal={setShowPaymentDetails} title={'Detalles del pago'}>
                            <motion.div
                                key={selectedPayment.id}
                                className="dark:bg-gray-800 w-[100%]"
                            >
                                <div className="flex justify-between space-x-3 items-center mb-4">
                                    <h3 className="text-lg truncate  font-semibold text-gray-800 dark:text-white">
                                        {selectedPayment.client_name.slice(0, 25)}
                                    </h3>
                                    <span
                                        className={`px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center ${selectedPayment.status === "pendiente"
                                            ? "bg-yellow-100 text-yellow-600"
                                            : selectedPayment.status === "completado"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                            }`}
                                    >
                                        {
                                            selectedPayment.status === "pendiente" ? (
                                                <Clock className="w-4 h-4 inline mr-1" />
                                            ) : selectedPayment.status === "completado" ? (
                                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                            ) : (
                                                <XCircle className="w-4 h-4 inline mr-1" />
                                            )
                                        }
                                        {selectedPayment.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                    <p>
                                        <strong>Monto:</strong> {selectedPayment.amount} {selectedPayment.currency}
                                    </p>
                                    <p className="truncate">
                                        <strong>Referencia:</strong> <span
                                        >{selectedPayment.reference}</span>
                                    </p>
                                    <p>
                                        <strong>Fecha pago:</strong>{" "}
                                        {new Date(selectedPayment.transactionDate).toLocaleDateString()}
                                    </p>
                                    <p>
                                        <strong>Fecha cita:</strong>{" "}
                                        {new Date(selectedPayment.Appointment.day).toLocaleDateString()}
                                    </p>

                                    <p>
                                        <strong>Hora cita:</strong>{" "}
                                        {` ${selectedPayment.Appointment.start_time} - ${selectedPayment.Appointment.end_time}`}
                                    </p>
                                    <p>
                                        <strong>Plataforma:</strong> {allMeetingPlatforms?.MeetingPlatforms.find(mp => mp.id === selectedPayment.Appointment.meetingPlatformId)?.name || 'No especificada'}
                                    </p>
                                    {selectedPayment.Appointment.meeting_link && (
                                        <p className="break-words">
                                            <strong>Link de la reunión:</strong>{" "}
                                            <a href={selectedPayment.Appointment.meeting_link} target="_blank"
                                                className="text-blue-500 hover:underline break-words">
                                                {selectedPayment.Appointment.meeting_link}
                                            </a>
                                        </p>
                                    )}

                                </div>
                                {
                                    selectedPayment.status === 'reembolso' || selectedPayment.status === 'reembolsado' || selectedPayment.status === 'fallido' ? (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            Contacta a Soporte para más información. <br />
                                            <strong>Numero de contacto
                                                Whatsapp: {allSettings?.configs.find(set => set.key === 'phone')?.value}
                                            </strong>
                                        </p>
                                    ) : null
                                }
                                {(selectedPayment) &&
                                    selectedPayment.status !== 'reembolsado' &&
                                    selectedPayment.status !== 'reembolso' &&
                                    <>
                                        <div className="relative group">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                   <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                whileHover={{ scale: 1.02 }}
                                                disabled={!isMoreThan8HoursFunc(selectedPayment)}
                                                whileTap={{ scale: 0.95 }}
                                                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-300 w-full cursor-pointer disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                onClick={() => handleCancelAppointment(selectedPayment.id)}
                                            >
                                                Cancelar Cita
                                            </motion.button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p className="text-white dark:text-gray-800">La cita solo se puede cancelar si faltan más de 8 horas para su inicio.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.95 }}
                                                disabled={!isMoreThan8HoursFunc(selectedPayment)}
                                                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300 w-full cursor-pointer disabled:opacity-50 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                onClick={() => (
                                                    setShowModal(true),
                                                    setIdAppointment(selectedPayment.Appointment.id))
                                                }
                                            >
                                                Editar Plataforma
                                            </motion.button>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p className="text-white dark:text-gray-800">Disponible solo hasta 8 h antes de la cita.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </>
                                }
                            </motion.div>
                        </Modal>
                    )
                }
            </AnimatePresence>
            <div>
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Citas</h1>
                    <p className="text-gray-500 dark:text-gray-400">A continuación, encontrarás una lista de tus citas programadas.</p>
                </div>
                {(appointmentsOfUser === null || appointmentsOfUser.paymentsOfUser.length === 0) ? (
                    <div className="w-full text-center pt-30 flex flex-col justify-center items-center">
                        <div className="p-5 rounded-full mb-5 bg-gray-200/50 ">
                            <ClipboardList className="w-8 h-8 inline-block" />
                        </div>
                        <p className="text-lg font-semibold mb-2">No tienes citas programadas.</p>
                        <p className="text-sm text-gray-400">Reserva una cita en la sección de citas de la pagina principal.</p>
                    </div>
                ) : (
                    <div
                        className="flex flex-col gap-2 items-start justify-start content-center w-full min-h-screen">
                        {newAppointments?.map((payment: PaymentOfUser) => (
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
                                            <strong>Fecha cita:</strong>{" "}
                                            {new Date(payment.Appointment.day).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p>
                                            <strong>Hora cita:</strong>{" "}
                                            {` ${payment.Appointment.start_time} - ${payment.Appointment.end_time}`}
                                        </p>
                                        <p>
                                            <strong>Plataforma:</strong> {allMeetingPlatforms?.MeetingPlatforms.find(mp => mp.id === payment.Appointment.meetingPlatformId)?.name || 'No especificada'}
                                        </p>
                                    </div>
                                    {payment.Appointment.meeting_link && (
                                        <p className="break-words">
                                            <strong>Link de la reunión:</strong>{" "}
                                            <a href={payment.Appointment.meeting_link} target="_blank"
                                                className="text-blue-500 hover:underline break-words">
                                                {payment.Appointment.meeting_link}
                                            </a>
                                        </p>
                                    )}

                                </div>
                                <div className="flex justify-between items-center">

                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 0.95 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        whileHover={{ scale: 1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-[200px] cursor-pointer"
                                        onClick={() => (setShowPaymentDetails(true),
                                            setSelectedPayment(payment))
                                        }
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
                                        <span
                                            className={`px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center ${payment.status === "pendiente"
                                                ? "bg-yellow-100 text-yellow-600"
                                                : appointmentIsCompleted(payment)
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                                }`}
                                        >
                                            <Clock className="w-4 h-4 inline mr-1" />

                                            Cita: {appointmentIsCompleted(payment) ? "Completada" : "Pendiente"}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                            <button className="text-center text-gray-700/40 dark:text-gray-100/40 w-full bg-none border-none underline hover:text-blue-500 underline-offset-8 cursor-pointer p-2"
                                onClick={() => setShowOlded(!showOlded)}
                            >{showOlded ? "Ocultar citas antiguas" : "Ver citas antiguas"}</button>
                            {showOlded && (
                                appointmentsOlded?.map((payment: PaymentOfUser) => (
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
                                                    <strong>Fecha cita:</strong>{" "}
                                                    {new Date(payment.Appointment.day).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p>
                                                    <strong>Hora cita:</strong>{" "}
                                                    {` ${payment.Appointment.start_time} - ${payment.Appointment.end_time}`}
                                                </p>
                                                <p>
                                                    <strong>Plataforma:</strong> {allMeetingPlatforms?.MeetingPlatforms.find(mp => mp.id === payment.Appointment.meetingPlatformId)?.name || 'No especificada'}
                                                </p>
                                            </div>
                                            {payment.Appointment.meeting_link && (
                                                <p className="break-words">
                                                    <strong>Link de la reunión:</strong>{" "}
                                                    <a href={payment.Appointment.meeting_link} target="_blank"
                                                        className="text-blue-500 hover:underline break-words">
                                                        {payment.Appointment.meeting_link}
                                                    </a>
                                                </p>
                                            )}

                                        </div>
                                        <div className="flex justify-between items-center">

                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 0.95 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                whileHover={{ scale: 1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-[200px] cursor-pointer"
                                                onClick={() => (setShowPaymentDetails(true),
                                                    setSelectedPayment(payment))
                                                }
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
                                                <span
                                                    className={`px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center ${payment.status === "pendiente"
                                                        ? "bg-yellow-100 text-yellow-600"
                                                        : appointmentIsCompleted(payment)
                                                            ? "bg-green-100 text-green-600"
                                                            : "bg-red-100 text-red-600"
                                                        }`}
                                                >
                                                    <Clock className="w-4 h-4 inline mr-1" />

                                                    Cita: {appointmentIsCompleted(payment) ? "Completada" : "Pendiente"}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                )
                }
            </div>
        </>
    )
}
