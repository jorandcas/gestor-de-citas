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
    const meetingPlatformIdParam = searchParams.get("meetingPlatformId");
    const [paymentData, setPaymentData] = useState<stripeSucces | null>(null);
    const [loading, setLoading] = useState(true);
    const hasSubmittedRef = useRef(false); // Evitar llamadas duplicadas

    const handleSubmitInfoOfPayment = useCallback(async () => {
        console.log("🔍 useStripe: handleSubmitInfoOfPayment llamado");
        console.log("📊 paymentData:", paymentData);
        console.log("📅 appointmentId:", appointmentId);
        console.log("🎯 meetingPlatformId de URL:", meetingPlatformIdParam);
        console.log("👤 session:", session ? "existe" : "no existe");
        console.log("🚫 hasSubmittedRef.current:", hasSubmittedRef.current);

        if (!session) {
            console.log("❌ No hay sesión, retornando");
            return;
        }
        // Evitar llamadas duplicadas
        if (hasSubmittedRef.current) {
            console.log("⚠️ Ya enviado previamente, evitando duplicado");
            return;
        }

        if (appointmentId && paymentData?.payment_status === "paid") {
            console.log("✅ Condiciones cumplidas, enviando a updateStatus");
            hasSubmittedRef.current = true; // Marcar como enviado
            try {
                // Primero intentar obtener meetingPlatformId de los parámetros URL
                let meetingPlatformId = meetingPlatformIdParam ? parseInt(meetingPlatformIdParam) : null;

                // Si no está en los parámetros URL, intentar del localStorage (fallback)
                if (!meetingPlatformId) {
                    const selectedAppointmentStr = localStorage.getItem('selectedAppointment');
                    console.log("📦 localStorage selectedAppointment (fallback):", selectedAppointmentStr);
                    const selectedAppointment = selectedAppointmentStr ? JSON.parse(selectedAppointmentStr) : null;
                    meetingPlatformId = selectedAppointment?.meetingPlatformId || null;
                }

                console.log("🎯 meetingPlatformId final:", meetingPlatformId);

                const payload = {
                    user_id: session?.user.id,
                    appointmentId: appointmentId,
                    paymentId: paymentData.id,
                    amount: paymentData.amount_total / 100,
                    client_name: paymentData.customer_details.name,
                    ...(meetingPlatformId && { meetingPlatformId })
                };
                console.log("📤 Enviando payload:", payload);

                await axios
                    .put(`${import.meta.env.VITE_API_BASE_URL}/payment-stripe/updateStatus`, payload)
                    .then((res) => {
                        console.log("✅ updateStatus response:", res.data);
                    })
                    .catch((err) => {
                        console.error("❌ Error en updateStatus:", err.response?.data || err.message);
                        // Resetear el flag si hay error para permitir reintentar
                        hasSubmittedRef.current = false;
                    });
            } catch (error) {
                console.error("❌ Error en handleSubmitInfoOfPayment:", error);
                if (axios.isAxiosError(error))
                    toast(error.message, {duration: 4000});
                // Resetear el flag si hay error
                hasSubmittedRef.current = false;
            }
        } else {
            console.log("⚠️ Condiciones no cumplidas:");
            console.log("  - appointmentId:", appointmentId);
            console.log("  - paymentStatus:", paymentData?.payment_status);
        }

    }, [appointmentId, paymentData, session, meetingPlatformIdParam]);

    const verifySession = useCallback(async () => {
        console.log("🔍 useStripe: verifySession llamado");
        console.log("🔑 sessionId:", sessionId);

        if (!sessionId) {
            console.log("❌ No hay sessionId");
            toast.error("No such session session");
            return;
        }
        try {
            console.log("📡 Llamando a verify-session...");
            await axios
                .get(`${import.meta.env.VITE_API_BASE_URL}/payment-stripe/verify-session?session_id=${sessionId}`)
                .then(res => {
                    console.log("✅ verifySession response:", res.data);
                    console.log("💳 payment_status:", res.data.session?.payment_status);
                    setPaymentData(res.data.session)
                })
                .catch((err) => {
                    console.error("❌ Error en verifySession:", err.response?.data || err.message);
                    setPaymentData(null)
                })
                .finally(() => setLoading(false));
        } catch (error) {
            console.error("❌ Error en verifySession:", error);
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
