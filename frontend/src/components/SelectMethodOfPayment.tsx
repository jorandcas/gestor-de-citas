import React, { useEffect } from 'react'
import { motion } from "motion/react";
import toast from "react-hot-toast";
import axios, { isAxiosError } from "axios";
import type { PaymentMethodResponseInterface } from "@/interfaces/paymentMethodInterface.ts";
import { Banknote, HelpCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import PaypalIcon from '@/components/icons/paypal.tsx'
import StripeIcon from '@/components/icons/stripe.tsx'
import type { AppointmentInterface } from '@/types';

export default function SelectMethodOfPayment({ session ,selectedAppointment}: { session: any ,selectedAppointment: AppointmentInterface | null}) {
    const navigate = useNavigate();
    const [paymentsMethods, setPaymentsMethods] = React.useState<PaymentMethodResponseInterface['data'] | null>(null);
    const handleGetOfAllMethodsOfPayment = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL
                }/payment-methods/`);
            setPaymentsMethods(response.data.paymentMethods);
        } catch (err) {
            if (isAxiosError(err))
                toast.error(err.message);
        }
    }
    function handleSelectMethod(methodName: string) {
        if(selectedAppointment === null){
            toast.error("Debes seleccionar una reserva");
            return;
        }
        // Normaliza el nombre para la ruta
        const route = `/payment/${methodName.toLowerCase().replace(/\s+/g, "-")}`;
        navigate(route);

    }
    function getPaymentIcon(name: string) {
        if (name.toLowerCase().includes("stripe")) return <StripeIcon className="w-8 h-8 text-blue-500 mb-2" />;
        if (name.toLowerCase().includes("paypal")) return <PaypalIcon className="w-8 h-8 text-indigo-500 mb-2" />;
        if (name.toLowerCase().includes("externo")) return <Banknote className="w-8 h-8 text-green-500 mb-2" />;
        return <HelpCircle className="w-8 h-8 text-gray-400 mb-2" />;
    }
    useEffect(() => {
        handleGetOfAllMethodsOfPayment()
    }, []);
    return (
        <div className="min-h-screen flex flex-col items-center justify-center mx-auto">
            {session?.user ? (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center"
                >
                    <div className="flex items-center justify-center space-x-4 w-full mb-6"><span className='text-black font-regular'>Bienvenido <span className='font-bold'>{session.user.firstName} {session.user.lastName} !</span></span><UserButton /></div>
                    <h2 className="text-4xl font-bold text-[#bd9554]">
                        Selecciona el metodo de pago
                    </h2>
                    <p className='text-gray-400 mt-2'>En este apartado puedes elegir con que metodo pagar tu reserva</p>
                    <div className="w-full max-w-7xl flex flex-col justify-center items-center space-y-6 space-x-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 w-full">
                            {paymentsMethods?.map((method) => (
                                <div
                                    key={method.id}
                                    className="border-2 shadow-sm border-primary-50 p-6 flex flex-col items-center bg-white shadow-md hover:shadow-lg hover:border-primary transition-all cursor-pointer group"
                                    onClick={() => handleSelectMethod(method.name)
                                    }
                                >
                                    {getPaymentIcon(method.name)}
                                    <h3 className="text-lg font-semibold mb-1 text-primary group-hover:text-[#bd9554] transition-colors">{method.name}</h3>
                                    <p className="text-gray-500 text-center text-sm">{method.description}</p>
                                </div>
                            ))}
                        </div>
                        {/* <div>
                            <SignOutButton>
                                <motion.button
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="cursor-pointer text-white bg-blue-600 max-w-[220px] w-full py-4 ">Cerrar Sesion</motion.button>
                            </SignOutButton>
                        </div> */}
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center justify-center space-y-4"
                >
                    <h2 className="text-4xl font-bold text-[#bd9554]">
                        Iniciar Sesion
                    </h2>
                    <p className='text-gray-400 mt-2'>Debes iniciar sesion para poder realizar una reservacion</p>
                    <div className="w-full flex justify-center items-center">
                        <SignInButton mode="modal" appearance={{
                            elements: {
                                input: {
                                    padding: "18px 8px",
                                    borderRadius: "0",
                                },
                                button: {
                                    color: "primary",
                                    borderRadius: "0",
                                    padding: "15px 8px",
                                    fontSize: "0.7rem",
                                    fontWeight: "regular",
                                    textTransform: "uppercase",
                                    letterSpacing: "1px",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease-in-out",
                                    "&:hover": {
                                        backgroundColor: "#bd9554",
                                    },
                                },
                            },
                        }}>
                            <motion.button
                                initial={{ y: -100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="cursor-pointer text-white bg-blue-600 max-w-[220px] w-full py-4 ">Iniciar Sesión</motion.button>
                        </SignInButton>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
