import type { PaymentAppointmentStripe } from '@/interfaces/stripeInterfaces';
import axios, { isAxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export default function usePaypalPayment() {
    const [paypalPayment, setPaypalPayment] = useState<PaymentAppointmentStripe[] | null>(null)
    const [filter, setFilter] = useState("all")
    const [dataFiltered, setDataFiltered] = useState<PaymentAppointmentStripe[] | null>(null)
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [infoPaypalPaymentById, setInfoOfPaypalPaymentById] = useState<PaymentAppointmentStripe | null>(null);
    const {state}=useLocation();
    const [idPaypalPayment, setIdPaypalPayment] = useState<number | null>(null);
    const [newStatusOfPaypalPayment, setNewStatusOfPaypalPayment] = useState<string | null | undefined>(infoPaypalPaymentById?.status);
    console.log(idPaypalPayment)
    const handleSubmitChangeStatusOfManualPayment = useCallback(async (id:number) => {
        try {
            if (newStatusOfPaypalPayment && id) {
                axios.put(`${import.meta.env.VITE_API_BASE_URL}/manual-payments/${id}`, {
                    status: newStatusOfPaypalPayment
                }).then(res => {
                    if (res.status >= 200 && res.status < 300) {
                        toast.success("Estado del pago actualizado correctamente")
                        FetchAllPaypalPayments()
                        setShowModal(false)
                        setNewStatusOfPaypalPayment(null)
                        setIdPaypalPayment(null)
                    }
                })
            }
        } catch (error) {
            if (isAxiosError(error)) toast.error(error.message)
        }
    }, [newStatusOfPaypalPayment])
    async function fetchPaypalPaymentById(id: number) {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/payment-paypal/${id}`
            );
            setInfoOfPaypalPaymentById(response.data);
        } catch (error) {
            if (isAxiosError(error))
                toast.error(error.message);
            return null;
        }
    };
    async function FetchAllPaypalPayments() {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/payment-paypal`
            );
            console.log(response.data)
            setPaypalPayment(response.data);
        } catch (error) {
            if (isAxiosError(error))
                toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        FetchAllPaypalPayments()
    }, []);
    useEffect(() => {

        if (state?.paymentId) {
            setIdPaypalPayment(state?.paymentId)
            fetchPaypalPaymentById(state?.paymentId)
            setShowModal(true)
        }
    }, [state]);
    useEffect(() => {
        if (filter === "all") {
            setDataFiltered(paypalPayment);
        } else {
            const filtered = paypalPayment?.filter(payment => payment.status === filter);
            setDataFiltered(filtered || null);
        }
    }, [paypalPayment, filter]);
    return {
        paypalPayment,
        dataFiltered,
        loading,
        filter,
        setFilter,
        showModal,
        setShowModal,
        fetchPaypalPaymentById,
        infoPaypalPaymentById,
        newStatusOfPaypalPayment,
        setNewStatusOfPaypalPayment,
        handleSubmitChangeStatusOfManualPayment,
    };
}
