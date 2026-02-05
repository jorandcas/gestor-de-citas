import { apiClient } from "@/api";
import type { ExternalPayment } from "@/interfaces/manualPaymentInterfaces";
import type { AppointmentInterface } from "@/types";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Función para obtener el nombre del día en español
function getDayName(day: string | Date): string {
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const date = typeof day === "string" ? new Date(day) : day;
  return dias[date.getDay()];
}

export default function useManagementAppointment() {
  const [appointments, setAppointments] = useState<AppointmentInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payments, setPayments] = useState<ExternalPayment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [appointmentsByDay, setAppointmentsByDay] = useState<
    Record<string, AppointmentInterface[]>
  >({});
  const daysOfWeek = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
  ];

  function normalizeDayName(day: string) {
    return day
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  }
  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await apiClient.get("/appointments");

        if (response.status >= 200 && response.status < 300) {
          const fetchedAppointments: AppointmentInterface[] =
            response.data.appointments;
          setAppointments(fetchedAppointments);
          const grouped: Record<string, AppointmentInterface[]> = {};
          fetchedAppointments
            .filter((ap) => ap.status === "reservado")
            .forEach((appointment: AppointmentInterface) => {
              const dayName = getDayName(appointment.day);
              if (!grouped[dayName]) grouped[dayName] = [];
              grouped[dayName].push(appointment);
            });
          setAppointmentsByDay(grouped);
          setLoading(false);
        } else {
          toast.error("Error al cargar las citas");
          setLoading(false);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al cargar las citas");
        setLoading(false);
      }
    }
    async function fetchPayments() {
      try {
        const response = await apiClient.get("/payments");
        if (response.status >= 200 && response.status < 300) {
          const fetchedPayments = response.data.payments;
          setPayments(fetchedPayments);
        } else {
          toast.error("Error al cargar los pagos");
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al cargar las citas");
        setLoading(false);
      }
    }
    fetchAppointments();
    fetchPayments();
  }, []);

  return {
    appointments,
    loading,
    appointmentsByDay,
    daysOfWeek,
    normalizeDayName,
    payments,
    showModal,
    setShowModal,
    selectedPayment,
    setSelectedPayment
  };
}
