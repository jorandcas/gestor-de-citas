import {useCallback, useEffect, useState} from "react";
import axios, {isAxiosError} from "axios";
import toast from "react-hot-toast";
import type {PaymentAppointmentStripe, StripePaymentsResponse} from "@/interfaces/stripeInterfaces.ts";
import { useLocation } from "react-router-dom";

export const useStripePayment = () => {
    const [loading, setLoading] = useState(false);
    const {state}=useLocation()
    const [allStripePayments, setAllStripePayments] = useState<StripePaymentsResponse | null>(null);
    const [dataFiltered, setDataFiltered] = useState(allStripePayments)
    const [filter, setFilter] = useState("all")
    const [idStripePayment, setIdStripePayment] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [infoOfStripePaymentById, setInfoOfStripePaymentById] = useState<PaymentAppointmentStripe | null>(null);
    const [newStatusOfStripePayment, setNewStatusOfStripePayment] = useState<string | null | undefined>(infoOfStripePaymentById?.status);

    useEffect(() => {
        if (filter === "all") {
            setDataFiltered(allStripePayments);
        } else {
            const filtered = allStripePayments?.paymentsAppointments.filter(payment => payment.status === filter);
            setDataFiltered({
                status: allStripePayments?.status || "",
                paymentsAppointments: filtered || []
            });
        }
    }, [allStripePayments, filter]);

    async function FetchAllStripePayments() {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/payment-stripe`
            );

            setAllStripePayments(response.data);
        } catch (error) {
            if (isAxiosError(error))
                toast.error(error.message);
        }finally {
            setLoading(false);
        }
    };
    const handleSubmitChangeStatusOfManualPayment = useCallback(async (id:number) => {
        try {
            if (newStatusOfStripePayment && id) {
                axios.put(`${import.meta.env.VITE_API_BASE_URL}/manual-payments/${id}`, {
                    status: newStatusOfStripePayment
                }).then(res => {
                    if (res.status >= 200 && res.status < 300) {
                        toast.success("Estado del pago actualizado correctamente")
                        FetchAllStripePayments()
                        setShowModal(false)
                        setNewStatusOfStripePayment(null)
                        setIdStripePayment(null)
                    }
                })
            }
        } catch (error) {
            if (isAxiosError(error)) toast.error(error.message)
        }
    }, [newStatusOfStripePayment])

    async function fetchStripePaymentById(id: number) {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/payment-stripe/${id}`
            );
            setInfoOfStripePaymentById(response.data.paymentAppointment);
        } catch (error) {
            if (isAxiosError(error))
                toast.error(error.message);
            return null;
        }
    };
    useEffect(() => {
        FetchAllStripePayments()
    }, []);
    useEffect(() => {

        if (state?.paymentId) {
            setIdStripePayment(state?.paymentId)
            fetchStripePaymentById(state?.paymentId)
            setShowModal(true)
        }
    }, [state]);
    return {
        dataFiltered,
        loading,
        setFilter,
        idStripePayment,
        setIdStripePayment,
        showModal,
        setShowModal,
        filter,
        infoOfStripePaymentById,
        setInfoOfStripePaymentById,
        newStatusOfStripePayment,
        setNewStatusOfStripePayment,
        fetchStripePaymentById, handleSubmitChangeStatusOfManualPayment
    }
};
