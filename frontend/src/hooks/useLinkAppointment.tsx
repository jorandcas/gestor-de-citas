import {type FormEvent, useEffect, useState} from "react";
import type {AppointmentInterface} from "@/types";
import axios from "axios";
import {catchError} from "../../Fetch.ts";
import toast from "react-hot-toast";

export const useLinkAppointment = () => {
    const [allAppointments, setAllAppointments] = useState<AppointmentInterface[] | null>(null);
    const urlBack = import.meta.env.VITE_API_BASE_URL
    const [urlMeet, setUrlMeet] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [idOfAppointment, setIdOfAppointment] = useState<number | null>(null);
    const [loading,setLoading] = useState(false);

    async function fetchAppointments() {
        const promise = axios.get(`${urlBack}/appointments`);
        const [data, error] = await catchError(promise)

        if (!data) {
            toast.error(error)
            return
        }
        setAllAppointments(data.data.appointments);

    }

    async function saveLink(e: FormEvent) {
        e.preventDefault()
        if (!urlMeet) return;
        const [data, error] = await catchError(axios.put(`${urlBack}/generate-link/save-meet-link/${idOfAppointment}`, {link: urlMeet}));
        if (!data) {
            toast.error(error)
            return
        }
        setShowModal(false)
        fetchAppointments()
        console.log(data)

        toast.success("Link guardado correctamente")
        fetchAppointments()
    }

    async function generateLinkWithMeet() {
        setLoading(true)
        const handleMessage = async () => {
            await fetch(`${urlBack}/generate-link/generate-meet-link/${idOfAppointment}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
            })
                .then((res) =>

                        res.json())
                .then((resData) => {
                    console.log(resData.status === "redirect")
                    if (resData.status === "redirect") {
                        toast.error("Necesitas autenticarte de nuevo.");
                        setLoading(false)
                        return;
                    }
                    setUrlMeet(resData.link)
                    toast.success("Link generado: " + resData.link);

                })
                .catch((err) => {

                    console.log(err)

                    toast.error("No se pudo generar el link");
                });
            setLoading(false)
        }
        const messageListener = () => {
            window.removeEventListener("message", messageListener);
            clearInterval(interval);
            win?.close();
        };
         window.addEventListener("message", messageListener
            , {once: true});
        const win = window.open(`${urlBack}/generate-link/auth`, "_blank", "width=500,height=600");

        const interval = setInterval(() => {
            if (win && win.closed) {
                clearInterval(interval);
                win.close()
                handleMessage()
            } else {
                try {
                    // Intenta leer el texto de la ventana hija
                    const text = win?.document.body.innerText;
                    if (text?.includes("Autenticación exitosa")) {
                        // Aquí puedes hacer lo que necesites
                        toast.success("Autenticación exitosa detectada.");
                        clearInterval(interval);
                        win?.close();
                        fetchAppointments();
                    }
                } catch (e) {
                    console.log(e)

                    toast.error('Error')
                }
            }
        }, 500);
    }

    async function generateLinkWithZoom() {
        setLoading(true);
        try {
            const response = await axios.post(`${urlBack}/generate-link/generate-zoom-link/${idOfAppointment}`);
            if (response.data.status === "success") {
                setUrlMeet(response.data.link);
                toast.success("Link de Zoom generado: " + response.data.link);
            } else if (response.data.message === "ZOOM_NOT_CONFIGURED") {
                toast.error("Zoom no está configurado en el servidor");
            } else {
                toast.error("No se pudo generar el link de Zoom");
            }
        } catch (error: any) {
            console.error("Error generando link de Zoom:", error);
            toast.error(error.response?.data?.message || "No se pudo generar el link de Zoom");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchAppointments()
    }, []);


    return {
        allAppointments,
        generateLinkWithMeet,
        generateLinkWithZoom,
        urlMeet,
        setUrlMeet,
        setShowModal, showModal,
        saveLink,
        setIdOfAppointment,loading
    }
};
