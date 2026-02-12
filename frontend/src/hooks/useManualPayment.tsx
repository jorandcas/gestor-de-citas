import type {
    ManualPaymentByIdInterface,
    ManualPaymentResponseInterface
} from '@/interfaces/manualPaymentInterfaces';
import {useSession} from '@clerk/clerk-react';
import axios, {isAxiosError} from 'axios';
import React, {useCallback, useEffect, useState} from 'react'
import toast from 'react-hot-toast';
import type {AppointmentInterface} from "@/types";
import {useLocation, useNavigate} from "react-router-dom";
const dataEmpty = {
    amount: "",
    transactionDate: "",
    reference: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    notes: "",
    appointment_id: "",
};
interface ManualPaymentsProps {
    selectedAppointment: AppointmentInterface | null;
    selectedPlatform?: number | null;
}

export default function useManualPayment({selectedAppointment}: ManualPaymentsProps) {
    const {state}=useLocation();
    const { session } = useSession();
    const [formData, setFormData] = useState({
		...dataEmpty,
		amount: selectedAppointment
			? String(selectedAppointment.price)
            : "",
        client_email: session?.user.emailAddresses[0]?.emailAddress || "",
        client_name: session?.user.firstName + " " + session?.user.lastName || "",
	});
    const [allManualPayments, setAllManualPayments] = useState<ManualPaymentResponseInterface |
        null>(null);
    const [paymentImage, setPaymentImage] = useState<File | null>(
        null
    );
    const [previewImage, setPreviewImage] = useState<string | null>(
        null
    );
    const [loading, setLoading] = useState(false);

    const [infoOfManualPaymentById, setInfoOfManualPaymentById] = useState<ManualPaymentByIdInterface | null>(null);

    // Debug: Monitorear cambios en infoOfManualPaymentById
    useEffect(() => {
        console.log("📊 infoOfManualPaymentById cambió:", infoOfManualPaymentById);
    }, [infoOfManualPaymentById]);
    const [idManualPayment, setIdManualPayment] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [dataFiltered, setDataFiltered] = useState(allManualPayments)
    const [filter, setFilter] = useState("all")
    const [showImageModal, setShowImageModal] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [newStatusOfManualPayment, setNewStatusOfManualPayment] = useState<string | null | undefined>(null);
    const navigate = useNavigate();

    // Sincronizar appointment_id cuando selectedAppointment cambie
    useEffect(() => {
        if (selectedAppointment?.id) {
            setFormData(prev => ({
                ...prev,
                appointment_id: String(selectedAppointment.id),
                amount: selectedAppointment.price ? String(selectedAppointment.price) : prev.amount
            }));
        }
    }, [selectedAppointment]);

    useEffect(() => {
        if (allManualPayments) {
            let filteredPayments = [...allManualPayments.data];

            // Ordenar por fecha más reciente primero
            filteredPayments.sort((a, b) => {
                const dateA = new Date(a.transactionDate).getTime();
                const dateB = new Date(b.transactionDate).getTime();
                return dateB - dateA; // Orden descendente (más reciente primero)
            });

            // Aplicar filtro si es necesario
            if (filter !== "all") {
                filteredPayments = filteredPayments.filter(payment =>
                    payment.status === filter && payment.appointment_id
                );
            }

            setDataFiltered({
                status: allManualPayments.status,
                data: filteredPayments
            });
        }
    }, [allManualPayments, filter])
    const handleSubmitChangeStatusOfManualPayment = useCallback(async () => {
        try {
            if (newStatusOfManualPayment && infoOfManualPaymentById) {
                axios.put(`${import.meta.env.VITE_API_BASE_URL}/manual-payments/${infoOfManualPaymentById.paymentAppointment.id}`, {
                    status: newStatusOfManualPayment
                }).then(res => {
                    if (res.status >= 200 && res.status < 300) {
                        toast.success("Estado del pago actualizado correctamente")
                        fetchAllManualPayments()
                        setShowModal(false)
                        setNewStatusOfManualPayment(null)
                        setIdManualPayment(null)
                    }
                })
            }
        } catch (error) {
            if (isAxiosError(error)) toast.error(error.message)
        }
    }, [newStatusOfManualPayment,infoOfManualPaymentById])


    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const {name, value} = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleImageChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0] || null;
        setPaymentImage(file);

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewImage(null);
        }
    };
    const fetchAllManualPayments = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/manual-payments/`
            );
            setAllManualPayments(response.data);
        } catch (error) {
            if (isAxiosError(error))
                toast.error(error.message);
        }finally {
            setLoading(false);
        }
    };
    const fetchManualPaymentById = async (id: number) => {
        console.log("🔍 fetchManualPaymentById llamado con ID:", id);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/manual-payments/${id}`
            );
            console.log("📦 Respuesta completa del backend:", JSON.stringify(response.data, null, 2));
            console.log("📦 response.data.data:", JSON.stringify(response.data.data, null, 2));

            // Backend returns {status: "success", data: {...}}
            const rawData = response.data.data;

            // Transformar datos al formato esperado por el componente ModalOfManualPaymentToSeeDetails
            const transformedData = {
                paymentAppointment: {
                    id: rawData.id,
                    user_id: rawData.user_id,
                    appointment_id: rawData.appointment_id,
                    paymentMethodId: rawData.paymentMethodId,
                    amount: rawData.amount,
                    status: rawData.status,
                    currency: rawData.currency,
                    transactionDate: rawData.transactionDate,
                    reference: rawData.reference,
                    client_name: rawData.client_name,
                    client_email: rawData.client_email,
                    client_phone: rawData.client_phone,
                    notes: rawData.notes,
                    is_approved: rawData.is_approved,
                    createdAt: rawData.createdAt,
                    updatedAt: rawData.updatedAt,
                },
                imageOfPayment: rawData.PaymentImages || []
            };

            console.log("✅ Datos transformados:", JSON.stringify(transformedData, null, 2));
            setInfoOfManualPaymentById(transformedData);
        } catch (error) {
            console.error("❌ Error en fetchManualPaymentById:", error);
            if (isAxiosError(error))
                toast.error(error.message);
            return null;
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (
            !formData.amount ||
            !formData.transactionDate ||
            !formData.client_name ||
            !formData.client_email ||
            !formData.client_phone
        ) {
            toast.error("Please fill in all required fields.");
            setLoading(false);
            return;
        }
        if (formData.transactionDate > new Date().toISOString().split('T')[0]) {
            toast.error("Transaction date cannot be in the future.");
            setLoading(false);
            return;
        }
        if (!paymentImage) {
            toast.error("Please upload a payment image.");
            setLoading(false);
            return;
        }
        try {
            const submissionData = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                submissionData.append(key, value);
            });
            if (!session?.user.id) {
                toast.error("Debe iniciar sesión para realizar un pago manual");
                setLoading(false);
                return;
            }
            submissionData.set('appointment_id', selectedAppointment ? String(selectedAppointment.id) : "");

            // Usar meetingPlatformId del selectedAppointment (no del localStorage)
            if (selectedAppointment?.meetingPlatformId) {
                console.log("📋 Agregando meetingPlatformId al pago:", selectedAppointment.meetingPlatformId);
                submissionData.append("meetingPlatformId", String(selectedAppointment.meetingPlatformId));
            } else {
                console.warn("⚠️ ADVERTENCIA: selectedAppointment no tiene meetingPlatformId");
            }

            submissionData.append("user_id", session?.user.id);
            submissionData.append("paymentImage", paymentImage);
            await axios
                .post(
                    `${
                        import.meta.env.VITE_API_BASE_URL
                    }/manual-payments`,
                    submissionData
                )
                .then(() => {
                    toast.success("Form submitted successfully!");
                    // NOTA: Ya no necesitamos limpiar selectedPlatform porque ahora leemos de selectedAppointment
                    // Redirigir directamente al dashboard (el pago necesita aprobación)
                    navigate("/user/appointments");
                    setFormData(dataEmpty);
                    setPaymentImage(null);
                    setPreviewImage(null);
                    setLoading(false);
                });
        } catch (error) {
            if (isAxiosError(error)) {
                // Extraer el mensaje del backend
                const errorMessage = error.response?.data?.message || error.message;
                toast.error(errorMessage);

                // Si hay detalles de la cita activa, mostrarlos en consola para debugging
                if (error.response?.data?.activeAppointment) {
                    console.log("Cita activa encontrada:", error.response.data.activeAppointment);
                }
            }
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchAllManualPayments();
    }, []);
    useEffect(() => {
        console.log("🔄 useEffect de idManualPayment ejecutado, idManualPayment:", idManualPayment);
        if (idManualPayment !== null) {
            fetchManualPaymentById(idManualPayment);
        }
    }, [idManualPayment]);
    useEffect(() => {
        console.log(state)
        if(state?.paymentId){
            setIdManualPayment(state.paymentId)
            setShowModal(true)
        }
    }, [state]);
    useEffect(() => {
        if(!newStatusOfManualPayment || !infoOfManualPaymentById) return
        handleSubmitChangeStatusOfManualPayment()

    }, [newStatusOfManualPayment, handleSubmitChangeStatusOfManualPayment, infoOfManualPaymentById, fetchManualPaymentById]);
    return {
        formData,
        paymentImage,
        previewImage,
        handleChange,
        handleImageChange,
        handleSubmit,
        setFormData,
        setPaymentImage,
        setPreviewImage,
        allManualPayments,
        setIdManualPayment,
        showModal,
        setShowModal,
        infoOfManualPaymentById,
        dataFiltered,
        isZoomed,
        setIsZoomed,
        showImageModal,
        setShowImageModal,
        setNewStatusOfManualPayment,
        newStatusOfManualPayment,
        filter,
        setFilter,
        loading
    }
}
