import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import toast from "react-hot-toast";

export const useSelectPlatformBeforePayment = () => {
    const navigate = useNavigate();

    async function handleSelectPlatformBeforePayment(e: FormEvent, idPlatform: number) {
        e.preventDefault();

        try {
            // Guardamos la plataforma seleccionada en localStorage
            localStorage.setItem('selectedPlatform', JSON.stringify(idPlatform));

            toast.success('Plataforma seleccionada correctamente', { duration: 2000 });

            // Redirigimos a la página de pago
            setTimeout(() => {
                navigate('/pago');
            }, 500);
        } catch (error) {
            toast.error('Error al seleccionar la plataforma');
            console.error(error);
        }
    }

    return {
        handleSelectPlatformBeforePayment
    }
};
