import { motion } from "motion/react";
import useManagementAppointment from "@/hooks/useManagementAppointment";
import {
    SearchIcon,
    Banknote,
    CheckCircle,
    Clock,
    User,
    Hash,
    Mail,
    Video as Platform

} from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import type {
    ExternalPayment,
} from "@/interfaces/manualPaymentInterfaces";
import { useMemo } from "react";
import Modal from "./Modal";
import { TZDate } from "@date-fns/tz";
import type { AppointmentInterface } from "@/types";

const ZONE = import.meta.env.VITE_ZONE_TIME || 'America/Caracas';

export default function ManagementOfAppointment() {
    const {
        loading,
        appointmentsByDay,
        daysOfWeek,
        normalizeDayName,
        payments,
        setShowModal,
        showModal,
        selectedPayment,
    } = useManagementAppointment();
    const { allMeetingPlatforms, allPaymentsMethods } = useSettings();
    
    const daysFilteredByPaymentCompleted:Record<string, AppointmentInterface[]> = useMemo(() => {
        const days: { [key: string]: any[] } = {};
        Object.keys(appointmentsByDay).forEach((day) => {
            const filteredAppointments = appointmentsByDay[day].filter(
                (appointment) =>
                    payments.some(
                        (payment) =>
                            payment.appointment_id === appointment.id &&
                            payment.status === 'completado'
                    )
            );
            if (filteredAppointments.length > 0) {
                days[day] = filteredAppointments;
            }
        });
        return days;
    }, [appointmentsByDay, payments]);
    const infoPayment = useMemo((): ExternalPayment | null => {
        if (selectedPayment === null) return null;
        return payments.find((p) => p.appointment_id === selectedPayment ) || null;
    }, [selectedPayment, payments]);

    return (
        <div className="container mx-auto px-4 py-6 ">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center"
            >
                {showModal && infoPayment &&
                    <Modal title="Información del pago" setShowModal={setShowModal} >
                        <div className="space-y-3">
                            <div className="flex items-center text-lg font-semibold text-blue-700">
                                <Banknote className="w-6 h-6 mr-2" />
                                Pago de la cita ID: <span className="font-bold text-gray-800">{infoPayment?.id}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                Estado: <span className="font-bold">{infoPayment?.status}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Clock className="w-5 h-5 text-blue-500 mr-2" />
                                Fecha del pago: <span className="font-bold">{new TZDate(infoPayment?.transactionDate).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Banknote className="w-5 h-5 text-yellow-500 mr-2" />
                                Método de pago: <span className="font-bold">{allPaymentsMethods?.data.find((method) => method.id === infoPayment?.paymentMethodId)?.name}</span>
                            </div>
                            <div className="text-gray-700 break-word">
                                <div className="flex items-center">
                                    <Hash className="w-5 h-5 text-gray-500 mr-2" /> 
                                    Referencia:
                                </div> <span className="font-bold">{infoPayment?.reference.slice(0,50)}{""}
                                    {infoPayment?.reference.slice(50,infoPayment.reference.length)}
                                </span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Banknote className="w-5 h-5 text-green-500 mr-2" />
                                Monto: <span className="font-bold">{infoPayment?.amount} {infoPayment?.currency}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <User className="w-5 h-5 text-blue-500 mr-2" />
                                Cliente: <span className="font-bold">{infoPayment?.client_name}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Mail className="w-5 h-5 text-gray-500 mr-2" />
                                Email: <span className="font-bold">{infoPayment?.client_email}</span>
                            </div>
                            {infoPayment?.notes && (
                                <div className="flex items-center text-gray-700">
                                    Notas: <span className="font-bold">{infoPayment?.notes}</span>
                                </div>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                                Para validar el pago debes ir a gestión de pagos.
                            </div>
                        </div>
                    </Modal>
                }


                <div className="max-md:flex-col max-md:items-start mb-6 flex items-center justify-between w-full">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                            Gestión de citas
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            En esta sección puedes gestionar las citas reservadas y su
                            información correspondiente.
                        </p>
                    </div>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : Object.keys(daysFilteredByPaymentCompleted).length > 0 ? (
                    <div className="grid grid-cols-6 gap-4 w-full">
                        {daysOfWeek.map((day) => {
                            const normalizedKeys =
                                Object.keys(appointmentsByDay).map(normalizeDayName);
                            const idx = normalizedKeys.indexOf(day);
                            const originalKey =
                                idx !== -1 ? Object.keys(appointmentsByDay)[idx] : null;
                            return (
                                <div
                                    key={day}
                                    className="col-span-1 bg-white p-2 rounded-lg text-center border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <label
                                        htmlFor={day}
                                        className="text-primary font-semibold text-center text-lg"
                                    >
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </label>

                                    {originalKey &&
                                        daysFilteredByPaymentCompleted[originalKey]?.map((appointment) => (
                                            <div
                                                className="mb-8 mt-2 space-y-2 bg-gray-100 shadow-lg rounded-lg dark:bg-gray-700 dark:text-white"
                                                key={appointment.id}
                                            >
                                                <div className="p-2 border border-gray-200 rounded-lg space-y-1 text-left">
                                                    <div className="flex flex-col items-center">
                                                        <div> 
                                                            <Clock className="inline-block mr-1 w-4 text-red-500" />
                                                            <span className="font-semibold">Hora:</span>

                                                        </div>
                                                        <span>{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center ">
                                                        <div>
                                                            <CheckCircle className="inline-block mr-1 w-4 text-green-500" />
                                                            <span className="font-semibold">Estado:</span>
                                                        </div>
                                                        {(() => {
                                                            const now = new TZDate(new Date(), ZONE);
                                                            const [hours, minutes] = appointment.start_time.split(':').map(Number);
                                                            
                                                            // Crear una nueva fecha con la zona horaria correcta
                                                            const appointmentDate = new TZDate(appointment.day, ZONE);
                                                            appointmentDate.setHours(hours, minutes, 0, 0);
                                                            
                                                            let statusText = appointment.status;
                                                            let statusClass = 'text-green-600';
                                                            
                                                            // Comparar las fechas teniendo en cuenta la zona horaria
                                                            if (appointment.status !== 'cancelado' && appointmentDate < now) {
                                                                statusText = 'completado';
                                                                statusClass = 'text-blue-600';
                                                            } else if (appointment.status === 'reservado') {
                                                                statusClass = 'text-green-600';
                                                            } else if (appointment.status === 'cancelado') {
                                                                statusClass = 'text-red-600';
                                                            }
                                                            
                                                            return (
                                                                <span className={statusClass}>
                                                                    {statusText}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>

                                                    <div className="flex flex-col items-center">
                                                        <div> 
                                                            <User className="inline-block mr-1 w-4 text-blue-500" />
                                                            <span className="font-semibold">Cliente:</span>
                                                        </div>
                                                        <span>{payments.find(p=>p.appointment_id === appointment.id)?.client_name.slice(0, 15) || '-'}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center ">
                                                        <div>
                                                            <Platform className="inline-block mr-1 w-4 text-purple-500" />
                                                            <span className="font-semibold">Plataforma:</span>
                                                        </div>
                                                        <span>{allMeetingPlatforms?.MeetingPlatforms?.find((platform) => platform.id === appointment.meetingPlatformId)?.name || '-'}</span>
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                            type: "spring",
                            duration: 0.4,
                            bounce: 0.2,
                        }}
                        className="overflow-hidden flex flex-col items-center justify-center mt-16"
                    >
                        <div className="bg-gray-200 w-fit p-4 rounded-full border border-gray-200 mb-6">
                            <SearchIcon className="w-8 h-8 mx-auto text-gray-400" />
                        </div>
                        <p className="text-center text-gray-600 text-lg mb-3">
                            No hay pagos manuales registrados
                        </p>
                        <p className="text-sm text-center text-gray-500">
                            cuando realicen un pago manual, aparecerá aquí
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
