import {useEffect, useState, useCallback, useRef} from "react";
import {useSession} from "@clerk/clerk-react";
import {useSearchParams} from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

interface stripeSucces {
    payment_status: string;
    status: string;
    id: string
    customer_details: {
        email: string
        name: string
    }
    amount_total: number

}

export default function useStripe() {

    const {session} = useSession()
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const appointmentId = searchParams.get("appointmentId");
    const [paymentData, setPaymentData] = useState<stripeSucces | null>(null);
    const [loading, setLoading] = useState(true);
    const hasSubmittedRef = useRef(false); // Evitar llamadas duplicadas

    const handleSubmitInfoOfPayment = useCallback(async () => {
        console.log("Hola")
        if (!session) return;
        // Evitar llamadas duplicadas
        if (hasSubmittedRef.current) return;

        if (appointmentId && paymentData?.payment_status === "paid") {
            hasSubmittedRef.current = true; // Marcar como enviado
            try {
                // Obtener plataforma seleccionada del localStorage
                const selectedAppointmentStr = localStorage.getItem('selectedAppointment');
                const selectedAppointment = selectedAppointmentStr ? JSON.parse(selectedAppointmentStr) : null;
                const meetingPlatformId = selectedAppointment?.meetingPlatformId || null;

                await axios
                    .put(`${import.meta.env.VITE_API_BASE_URL}/payment-stripe/updateStatus`, {
                        user_id: session?.user.id,
                        appointmentId: appointmentId,
                        paymentId: paymentData.id,
                        amount: paymentData.amount_total / 100,
                        client_name: paymentData.customer_details.name,
                        ...(meetingPlatformId && { meetingPlatformId })
                    })
                    .then((res) => {
                        console.log(res);
                        // NOTA: Ya no necesitamos limpiar selectedPlatform porque ahora leemos de selectedAppointment
                    })
                    .catch((err) => {
                        console.error(err);
                        // Resetear el flag si hay error para permitir reintentar
                        hasSubmittedRef.current = false;
                    });
            } catch (error) {
                if (axios.isAxiosError(error))
                    toast(error.message, {duration: 4000});
                // Resetear el flag si hay error
                hasSubmittedRef.current = false;
            }
        }

    }, [appointmentId, paymentData, session]);

    const verifySession = useCallback(async () => {
        if (!sessionId) {
            toast.error("No such session session");
        }
        try {
            await axios
                .get(`${import.meta.env.VITE_API_BASE_URL}/payment-stripe/verify-session?session_id=${sessionId}`)
                .then(res => {
                    console.log(res)
                    setPaymentData(res.data.session)
                })
                .catch(() => setPaymentData(null))
                .finally(() => setLoading(false));
        } catch (error) {
            if (axios.isAxiosError(error))
                toast.error(error.message);
        }
    }, [sessionId]);
    useEffect(() => {
        verifySession();

    }, [verifySession, sessionId]);
    useEffect(() => {
        handleSubmitInfoOfPayment();
    }, [handleSubmitInfoOfPayment]);

    return {
        paymentData,
        loading,
        appointmentId
    }
}
