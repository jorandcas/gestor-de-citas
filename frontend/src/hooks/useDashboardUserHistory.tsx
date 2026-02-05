import { useCallback, useEffect, useState } from 'react'
import { useSession } from "@clerk/clerk-react";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import type { PaymentOfUser } from "@/interfaces/dashboardUserInterfaces.ts";
import { apiClient } from "../api";

export default function useDashboardUserHistory() {
    const { session } = useSession()
    const [paymentsOfUser, setPaymentsOfUser] = useState<PaymentOfUser[] | null>(null)
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    // const [idPayment, setIdPayment] = useState<number | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const fetchData =
        useCallback(async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/payments/getByUserId/${session?.user.id}`);
                if(!response.data.payments) {
                    console.log("Advertencia: No se encontro ningun pago asociado a este usuario")
                };
                setPaymentsOfUser(response.data.payments);
            } catch (error) {
                if (isAxiosError(error))
                    toast.error(`Error al obtener las citas del usuario ${error.message}`);
                else
                    toast.error(`Error al obtener las citas del usuario ${error}`);
            } finally {
                setLoading(false);
            }
        }, [session?.user.id]
        )

    useEffect(() => {
        fetchData()
    }, []);

    return {
        paymentsOfUser,
        loading,
        setShowModal,
        showModal,
        // setIdPayment,
        showImageModal,
        setShowImageModal,
        isZoomed,
        setIsZoomed,
    }

}
