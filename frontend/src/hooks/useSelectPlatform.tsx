import {useParams} from "react-router-dom";
import {catchError} from "../../Fetch.ts";
import axios from "axios";
import type {FormEvent} from "react";
import toast from "react-hot-toast";
import {useNavigate} from "react-router-dom";

export const useSelectPlatform = () => {
    const params = useParams()
    const idAppointment = params.id
    const navigate = useNavigate();

    async function handleSubmitPlatform(e: FormEvent, idPlatform: number) {
        e.preventDefault();

        // Primero obtener la cita actualizada desde el backend
        const promise = axios.put(`${import.meta.env.VITE_API_BASE_URL}/appointments/update-appointment-platform/${idAppointment}`, {meetingPlatformId: idPlatform});
        const [data, error] = await catchError(promise)

        if (!data) {
            toast.error(error)
            return
        }

        // Actualizar localStorage con la cita actualizada
        const updatedAppointment = data.data.appointment;
        localStorage.setItem('selectedAppointment', JSON.stringify(updatedAppointment));

        toast.success(data.data.message, {duration: 2000})
        setTimeout(() => {
            toast.success(
                "Ahora selecciona el método de pago"
            )
            setTimeout(() => {
                navigate("/pago")
            }, 1000)

        }, 2000)
    }

    return {
        handleSubmitPlatform
    }
};
