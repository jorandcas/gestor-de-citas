import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocation, useParams } from "react-router-dom";
import type { PaypalCaptureResponse } from "@/interfaces/paypalInterfaces";
import { useSession } from "@clerk/clerk-react";

export default function usePaypal() {
  const { id } = useParams();
  const {session}=useSession()
  const [loading, setLoading] = useState(false);
  const [dataPayment, setDataPayment] = useState<PaypalCaptureResponse | null>(null);
  const urlBack = import.meta.env.VITE_API_BASE_URL;
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tokenParam = searchParams.get("token");
  const hasCapturedRef = useRef(false);
  const hasSubmittedRef = useRef(false); // Evitar llamadas duplicadas al guardar pago

  const createOrderOfPayment = async (
    e: FormEvent,
    appoinmentId: number,
    amount: number
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${urlBack}/payment-paypal/create-order`, {
        appointmentId: appoinmentId,
        amount: amount,
      });
      const approveUrl = response.data.payerActionLink;
      window.location.href = approveUrl;
    } catch (error) {
      console.log(error)
      if (axios.isAxiosError(error)) {
        console.error("Error en la solicitud Axios:", error.response?.data || error.message);
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const capturePayment = useCallback(async () => {
    if (!tokenParam) {
      toast.error("No se proporcionó un token de PayPal");
      return;
    }
    // Evitar llamadas duplicadas
    if (hasSubmittedRef.current) return;

    setLoading(true);
    hasSubmittedRef.current = true; // Marcar como procesando

    try {
      const response = await axios.post(`${urlBack}/payment-paypal/capture-order`, {
        orderId: tokenParam,
      });
      setDataPayment(response.data);
      toast.success("Pago capturado con éxito");
      setLoading(false);
      try {
        // Obtener plataforma seleccionada del localStorage
        const selectedAppointmentStr = localStorage.getItem('selectedAppointment');
        const selectedAppointment = selectedAppointmentStr ? JSON.parse(selectedAppointmentStr) : null;
        const meetingPlatformId = selectedAppointment?.meetingPlatformId || null;

        const saveResponse = await axios.post(`${urlBack}/payment-paypal/save-payment`, {
          appointmentId: id,
          paypalOrderId: response.data.id,
          status: response.data.status,
          name: response.data.payer.name.given_name + " " + response.data.payer.name.surname,
          payerEmail: response.data.payer.email_address,
          currency: response.data.purchase_units[0].payments.captures[0].amount.currency_code,
          amount: response.data.purchase_units[0].payments.captures[0].amount.value,
          userId: session?.user.id,
          ...(meetingPlatformId && { meetingPlatformId })
        });

        // NOTA: Ya no necesitamos limpiar selectedPlatform porque ahora leemos de selectedAppointment

        toast.success(saveResponse.data.message);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error.message);
          // Resetear el flag si hay error
          hasSubmittedRef.current = false;
        }
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error en la solicitud Axios:", error.response?.data || error.message);
        toast.error(error.message);
        setLoading(false);
        // Resetear el flag si hay error
        hasSubmittedRef.current = false;
        return;
      }
      toast.error("Error al guardar el Pago. Pongase en contacto con el soporte.");
    } finally {
      setLoading(false);
    }
  }, [tokenParam, id, urlBack, session]);

  useEffect(() => {
    if (!tokenParam || loading) return;

    if (hasCapturedRef.current) return;

    hasCapturedRef.current = true;

    capturePayment()
  }, [tokenParam, loading, capturePayment]);

  return {
    createOrderOfPayment,
    loading,
    dataPayment,
    id
  };
}
