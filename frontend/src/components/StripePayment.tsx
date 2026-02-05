import {motion} from "motion/react";
import type {AppointmentInterface} from "@/types";
import {BadgeDollarSign, Calendar, CheckCircle, Clock, Loader2, XCircle} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import type {FormEvent, JSX} from "react";
import {useSettings} from "@/hooks/useSettings.tsx";

interface StripePaymentsProps {
    selectedAppointment: AppointmentInterface | null;
    selectedPlatform?: number | null;
}

export default function StripePayment({selectedAppointment}: StripePaymentsProps) {

    const statusMap: Record<string, { icon: JSX.Element; label: string; color: string }> = {
        disponible: { icon: <CheckCircle className="text-green-500 inline" />, label: "Disponible", color: "text-green-600" },
        reservado: { icon: <Loader2 className="text-blue-500 inline" />, label: "Reservado", color: "text-blue-600" },
        completado: { icon: <CheckCircle className="text-emerald-500 inline" />, label: "Completado", color: "text-emerald-600" },
        cancelado: { icon: <XCircle className="text-red-500 inline" />, label: "Cancelado", color: "text-red-600" }
    };
    const status = statusMap[selectedAppointment ? selectedAppointment.status : ""];
    const date = new Date(selectedAppointment ? selectedAppointment.day : "").toLocaleDateString();
    const start = selectedAppointment?.start_time;
    const end = selectedAppointment?.end_time;
    const {allCurrencies}=useSettings()
    const handleSubmitPaymentWithStripePayment = async (e:FormEvent): Promise<void> => {
        e.preventDefault();

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/payment-stripe/create-checkout-session`, {
                appointmentId: selectedAppointment?.id,
                amount: selectedAppointment?.price,
                success_url:'http://localhost:5173/',
                cancel_url:'http://localhost:5173/'
            })
            console.log(response)

            if(response.status >=  200 || response.status < 300) {
                const { url } = response.data;
                window.location.href = url;



            }
        }catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error en la solicitud Axios:', error.response?.data || error.message);
                toast.error(error.message);
            }
        }
    }
    return (
        <div className="min-h-screen w-full max-md:flex max-md:flex-col flex justify-center mx-auto px-4 py-6 space-x-6 space-y-6 mt-[70px]">            <motion.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                exit={{scale: 0.5, opacity: 0}}
                className="bg-white rounded-lg flex flex-col items-center overflow-hidden"
            >
            <h2 className="text-4xl font-bold mb-4 text-[#bd9554]">
                Formulario de Pago con Stripe
            </h2>
                {selectedAppointment ? (
                        <form action="POST" onSubmit={handleSubmitPaymentWithStripePayment}>
                        <div className="w-[350px] size-fit shadow-sm rounded-lg p-6 border border-gray-200">
                            <h3 className="text-2xl font-semibold mb-4 text-[#bd9554]">Detalles de la Cita</h3>
                            <ul className="space-y-4 text-[#1e1e1e]">
                                <li>
                                    <Calendar className="inline mr-2 text-[#bd9554]" />
                                    <strong>Fecha:</strong> {date ? date : "N/A"}
                                </li>
                                <li>
                                    <Clock className="inline mr-2 text-[#bd9554]" />
                                    <strong>Hora:</strong> {start} - {end}
                                </li>
                                <li>
                                    <BadgeDollarSign className="inline mr-2 text-[#bd9554]" />

                                    <strong>Precio:</strong> {allCurrencies?.currencies?.find(cur => cur.id === selectedAppointment.currency_id)?.symbol}    {selectedAppointment.price}
                                </li>
                                <li>
                                    {status.icon}
                                    <strong className={`ml-2 ${status.color}`}>Estado:</strong> {status.label}
                                </li>
                            </ul>
                            <div className="mt-[30px]">
                                <button
                                    type="submit"
                                    className="bg-[#1e1e1e] h-12 text-white px-4 py-2 hover:bg-[#1e1e1ed4] transition-colors w-full cursor-pointer"
                                >
                                    Enviar
                                </button>
                            </div>
                        </div>
                        </form>
                    ):
                    (
                        <div className="w-1/4 size-fit shadow-sm rounded-lg p-6 border border-gray-200 flex items-center justify-center">
                            <p className="text-gray-400">No hay ninguna cita seleccionada</p>
                        </div>
                    )}

            </motion.div>
        </div>
    )
}
