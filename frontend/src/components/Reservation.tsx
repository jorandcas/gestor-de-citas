import { useState, useEffect } from 'react';
import type { AppointmentInterface, DayInfo } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { apiClient } from '../api/index';
import toast from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import {
    format,
    startOfWeek,
    addDays,
    isSameDay,
    set,
} from 'date-fns';

import { es } from 'date-fns/locale';
import { TZDate } from "@date-fns/tz";

import { ChevronDownIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {useSettings} from "@/hooks/useSettings.tsx";

const ZONE = import.meta.env.VITE_ZONE_TIME || 'America/Caracas';

const AdminApp = () => {
    const [appointments, setAppointments] = useState<AppointmentInterface[]>([]);
    const [openDateSelector, setOpenDateSelector] = useState(false);
    const {allSettings}=useSettings()
    const [formData, setFormData] = useState<AppointmentInterface>({
        id: 0,
        day: new TZDate(new Date(), ZONE),
        start_time: '',
        end_time: '',
        reservation: 0,
        reservation_date: null,
        status: 'disponible',
        price: 0,
        isDeleted: false,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [pendingDate, setPendingDate] = useState<Date | null>(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);

    const openAddModal = ({ name, fullDate }: { name: string; fullDate: Date }) => {
        // Mapeo de días de la semana (0: Domingo, 1: Lunes, ..., 6: Sábado)
        const weekDays = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
        const price = allSettings?.configs?.find(s=>s.key==='priceAppointment')?.value ? Number(allSettings.configs.find(s=>s.key==='priceAppointment')?.value):0
        console.log(price)

        //Extraer el nombre del día si es un objeto
        const dayString = name;

        // Obtener el índice del día seleccionado (0-6)
        const selectedDayIndex = weekDays.findIndex(d => d === dayString.toUpperCase());

        if (selectedDayIndex === -1) {
            toast.error('Día de la semana no válido');
            return;
        }

        const today = new TZDate(new Date(), ZONE);
        const selectedDate = new TZDate(fullDate, ZONE);

        if (selectedDate < today) {
            setPendingDate(selectedDate);
            setShowConfirmModal(true);
            return;
        }

        setFormData({
            id: 0,
            day: selectedDate,
            start_time: '',
            end_time: '',
            reservation: 0,
            reservation_date: null, // Se establecerá cuando se haga la reserva
            status: 'disponible',
            isDeleted: false,
            price: price,
        });
        setEditingId(null);
        setShowModal(true);
    };

    // Función para manejar la selección de fecha
    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;

        const today = new TZDate(new Date(), ZONE);
        today.setHours(0, 0, 0, 0); // Normalizar la fecha de hoy

        const selectedDay = new TZDate(selectedDate);
        selectedDay.setHours(0, 0, 0, 0); // Normalizar la fecha seleccionada

        if (selectedDay < today) {
            setShowModal(false);
            setOpenDateSelector(false);
            setPendingDate(selectedDay);
            setShowConfirmModal(true);
            return;
        }

        setFormData(prev => ({
            ...prev,
            day: selectedDate
        }));

        setOpenDateSelector(false);
    };
    // Obtener las fechas de la semana actual
    const getCurrentWeekDates = () => {
        let today = new TZDate(new Date(), ZONE);

        const isSunday = today.getDay() === 0;

        // Si es domingo, se ajusta a lunes
        if (isSunday) {
            today = addDays(today, 1);
        }

        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Lunes como primer día de la semana

        const weekDays = [
            'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'
        ];

        // Crear arreglo con los días y sus fechas
        return weekDays.map((day, index) => {
            const dayDate = addDays(startOfCurrentWeek, index);
            const dayNumber = parseInt(format(dayDate, 'd'), 10); // Obtener el día del mes como número
            const month = format(dayDate, 'MMM', { locale: es }).toUpperCase();

            // Establecer la hora al final del día (23:59:59.999)
            const dateWithTime = set(dayDate, {
                hours: 23,
                minutes: 59,
                seconds: 59,
                milliseconds: 999
            });

            return {
                name: day,
                date: dayNumber,
                month: month,
                fullDate: dateWithTime
            };
        });
    };

    const dayNames: DayInfo[] = getCurrentWeekDates();

    // Cargar citas al montar el componente
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const startDate = dayNames[0]?.fullDate;
                const endDate = dayNames[dayNames.length - 1]?.fullDate;

                const response = await apiClient.get('/appointments', {
                    params: {
                        startDate: startDate?.toISOString(),
                        endDate: endDate?.toISOString()
                    }
                });
                if (Number(response.status) >= 200 && Number(response.status) < 300) {
                    // console.log('appointments', response.data);
                    setAppointments(response.data.appointments);
                    setLoading(false);
                } else {
                    toast.error('Error al cargar las citas');
                    setLoading(false);
                }
            } catch (err) {
                toast.error('Error al cargar las citas');
                console.error('Error fetching appointments:', err);
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);
    const timeToSeconds = (timeStr: string) => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return (hours * 3600) + (minutes * 60) + (seconds || 0);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validaciones de tiempo
        const now = new TZDate(new Date(), ZONE);
        const currentTime = now.toTimeString().slice(0, 8); // Formato HH:MM:SS
        const currentDate = now.toISOString().split('T')[0];
        const selectedDate = formData.day ? new TZDate(formData.day, ZONE).toISOString().split('T')[0] : null;

        // Validar hora de inicio vs hora actual (solo si es el día actual)
        if (selectedDate === currentDate && formData.start_time) {
            const selectedTimeSec = timeToSeconds(formData.start_time);
            const currentTimeSec = timeToSeconds(currentTime);
            if (selectedTimeSec < currentTimeSec) {
                toast.error('La hora de inicio no puede ser menor a la hora actual');
                return;
            }
        }

        // Validar que start_time no sea mayor que end_time
        if (formData.start_time && formData.end_time) {
            const startTimeSec = timeToSeconds(formData.start_time);
            const endTimeSec = timeToSeconds(formData.end_time);

            if (startTimeSec > endTimeSec) {
                toast.error('La hora de inicio no puede ser mayor que la hora de fin');
                return;
            }
        }

        // Validar campos requeridos
        if (!formData.start_time || !formData.end_time) {
            toast.error('Por favor completa todos los campos de tiempo');
            return;
        }

        try {
            const dayDate = new TZDate(formData.day, ZONE);

            if (!formData.day) {
                toast.error("No hay ninguna fecha valida seleccionada");
                return;
            };
            // Preparar los datos para enviar al backend
            const appointmentData = {
                ...formData,
                // Formatear la fecha como YYYY-MM-DD
                day: format(dayDate, 'yyyy-MM-dd'),
            };

            if (editingId) {
                // Actualizar horario existente
                const response = await apiClient.put(`/appointments/${editingId}`, appointmentData);
                if (response.data.status === 'success') {
                    toast.success(response.data.message || 'Horario actualizado exitosamente');
                    setAppointments(appointments.map(app =>
                        app.id === editingId ? response.data.data : app
                    ));
                    closeCustomModal();
                }
            } else {
                // Agregar un nuevo horario
                const response = await apiClient.post('/appointments', appointmentData);
                if (response.status === 201) {
                    toast.success('Horario guardado exitosamente');
                    setAppointments([...appointments, response.data.newAppointment]);
                    closeCustomModal();
                }
            }

            // Resetear el formulario
            setFormData({
                id: 0,
                day: new TZDate(new Date(), ZONE),
                start_time: '',
                end_time: '',
                reservation: 0,
                reservation_date: null,
                status: 'disponible',
                isDeleted: false,
                price: 0,
            });
            setEditingId(null);

            // Resetear el formulario y cerrar el modal

        } catch (err) {
            toast.error('Error al guardar la cita');
            console.error('Error saving appointment:', err);
        }
    };

    const handleEdit = (appointment: AppointmentInterface) => {
        setFormData({
            id: appointment.id,
            day: typeof appointment.day === 'string'
                ? new TZDate(new Date(appointment.day), ZONE)
                : appointment.day,
            start_time: appointment.start_time,
            end_time: appointment.end_time,
            reservation: appointment.reservation,
            reservation_date: appointment.reservation_date,
            status: appointment.status,
            isDeleted: appointment.isDeleted,
            price: appointment.price,
        });
        setEditingId(appointment.id);
        setShowModal(true);
    };

    const handleDeleteClick = (id: number) => {
        setAppointmentToDelete(id);
        setShowDeleteConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!appointmentToDelete) return;

        try {
            // Realizar la petición de eliminación lógica
            await apiClient.delete(`/appointments/${appointmentToDelete}`);

            // Actualizar el estado local marcando la cita como eliminada
            const updatedAppointments = appointments.map(appt =>
                appt.id === appointmentToDelete
                    ? {
                        ...appt,
                        isDeleted: true,
                    }
                    : appt
            );

            setAppointments(updatedAppointments);
            toast.success('Horario eliminado exitosamente');
        } catch (err) {
            toast.error('Error al eliminar el horario');
            console.error('Error deleting appointment:', err);
        } finally {
            setShowDeleteConfirmModal(false);
            setAppointmentToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirmModal(false);
        setAppointmentToDelete(null);
    };

    const closeCustomModal = () => {
        setShowModal(false);
        setFormData({
            id: 0,
            day: new TZDate(new Date(), ZONE),
            start_time: '',
            end_time: '',
            reservation: 0,
            reservation_date: null,
            status: 'disponible' as const,
            isDeleted: false,
            price: 0,
        });
        setEditingId(null);
    };

    const confirmCreateForNextWeek = () => {
        if (!pendingDate) return;

        const nextWeek = new Date(pendingDate);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(12, 0, 0, 0)

        setFormData(prev => ({
            ...prev,
            day: new TZDate(nextWeek, ZONE),
            reservation_date: null
        }));

        setShowConfirmModal(false);
        setPendingDate(null);
        setShowModal(true);
    };


    return (
        <div className="">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div>
                    <AnimatePresence>
                        {showModal && (
                            <motion.div className="fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className='fixed backdrop-blur-xs inset-0 bg-gray-600/50 h-full w-full'>

                                </motion.div>
                                <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative p-6 bg-white border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800 rounded-lg max-w-lg w-full">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                                        {editingId ? 'Actualizar Horario' : 'Crear Horario'}
                                    </h3>
                                    <form onSubmit={handleAddOrUpdate} className="flex flex-col gap-4">
                                        <div className='flex gap-3'>
                                            <div className="flex-1 flex flex-col gap-3">
                                                <Label htmlFor="date-picker" className="px-1">
                                                    Fecha
                                                </Label>
                                                <Popover open={openDateSelector} onOpenChange={setOpenDateSelector}>
                                                    <PopoverTrigger asChild>
                                                        <div
                                                            id="date-picker"
                                                            className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none w-full flex justify-between items-center"
                                                        >
                                                            {formData.day ? formData.day.toLocaleDateString() : "Select date"}
                                                            <ChevronDownIcon />
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={formData.day}
                                                            captionLayout="dropdown"
                                                            onSelect={handleDateSelect}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-3">
                                                <Label htmlFor="time-picker-start" className="px-1">
                                                    Hora de inicio
                                                </Label>
                                                <Input
                                                    type="time"
                                                    id="time-picker-start"
                                                    name="start_time"
                                                    step="1"
                                                    value={formData.start_time}
                                                    onChange={handleTimeChange}
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col gap-3">
                                                <Label htmlFor="time-picker-end" className="px-1">
                                                    Hora de finalización
                                                </Label>
                                                <Input
                                                    type="time"
                                                    name="end_time"
                                                    id="time-picker-end"
                                                    value={formData.end_time}
                                                    onChange={handleTimeChange}
                                                    step="1"
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <Label htmlFor="status-select" className="px-1 flex-1 gap-3 flex flex-col justify-center items-start">
                                                Estado
                                                <Select defaultValue={formData.status} onValueChange={(value) => setFormData(
                                                    (prev: AppointmentInterface) => ({
                                                        ...prev,
                                                        status: value as AppointmentInterface['status']
                                                    }))}>
                                                    <SelectTrigger id="status-select" className="w-full">
                                                        <SelectValue placeholder="Seleccionar estado" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Estado</SelectLabel>
                                                            <SelectItem value="disponible">Disponible</SelectItem>
                                                            <SelectItem value="reservado">Reservado</SelectItem>
                                                            <SelectItem value="completado">Completado</SelectItem>
                                                            <SelectItem value="cancelado">Cancelado</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </Label>
                                            <Label htmlFor="price" className="px-1 flex-1 gap-3 flex flex-col justify-center items-start">
                                                Precio
                                                <Input
                                                    type="text"
                                                    id="price"
                                                    name="price"
                                                    value={formData.price}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Solo actualiza si el valor es un número o está vacío
                                                        if (value === '' || /^\d+$/.test(value)) {
                                                            setFormData({
                                                                ...formData,
                                                                price: value === '' ? 0 : Number(value)
                                                            });
                                                        }
                                                    }}
                                                    className="w-full"
                                                />
                                            </Label>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                type="button"
                                                onClick={closeCustomModal}
                                                className="px-6 py-2 rounded-lg text-gray-100 dark:text-gray-200 bg-gray-700 dark:bg-gray-700 dark:text-gray-300 font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-600 dark:hover:bg-gray-600 transition duration-200 flex-1"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700 transition duration-200 flex-1"
                                            >
                                                {editingId ? 'Actualizar' : 'Crear'}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="max-w-7xl w-full mx-auto">
                        <motion.h1
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1, type: 'spring', stiffness: 100 }}
                            className="text-3xl font-bold mb-3 text-center text-gray-800 dark:text-gray-100"
                        >
                            Panel de Administración de Asesorías
                        </motion.h1>

                        <hr className="mb-2 mt-4 bg-[#bd9554] max-w-[400px] mx-auto" />
                        <motion.h2
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ duration: 0.3, delay: 0.1, type: 'spring', stiffness: 100 }}
                            className="text-2xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
                        >
                            Horarios Existentes
                        </motion.h2>
                        <div className="flex flex-col md:flex-row gap-4 pb-4">
                            {dayNames.map((day, index) => (
                                <motion.div
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -100, opacity: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1, type: 'spring', stiffness: 100 }}
                                    key={`${day.name}-${index}`}
                                    className="flex-1 min-w-[100px] p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm"
                                >
                                    <div className="flex flex-col space-y-2 justify-between items-center mb-4">
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-[#bd9554]">{day.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {day.date} {day.month}
                                            </p>
                                        </div>
                                        <motion.button
                                            initial={{ scale: 1, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 1, opacity: 0 }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ duration: 0.1 }}
                                            onClick={() => openAddModal(day)}
                                            className="p-2 w-full flex justify-center items-center bg-gray-800 dark:bg-blue-600 dark:hover:bg-blue-500 border border-gray-200 dark:border-gray-700 text-white hover:bg-gray-700 transition-colors mt-2 rounded-md cursor-pointer"
                                            aria-label={`Agregar horario para ${day.name}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </motion.button>
                                    </div>
                                    {appointments && appointments.filter(appt => {
                                        const apptDate = new TZDate(new Date(appt.day), ZONE);
                                        const targetDate = typeof day === 'string' ? new Date() : day.fullDate;
                                        const targetDay = typeof day === 'string' ? day : day.name;

                                        if (typeof day === 'string') {
                                            const apptDay = format(apptDate, 'EEEE', { locale: es }).toUpperCase();
                                            return apptDay === targetDay.toUpperCase();
                                        }

                                        return isSameDay(apptDate, targetDate);
                                    }).length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm">No hay horarios.</p>
                                    ) : (
                                        <ul className="space-y-8">
                                            {appointments
                                                    .filter(appt => {
                                                    // Omitir citas eliminadas lógicamente
                                                    if (appt.isDeleted) return false;

                                                    const apptDate = new Date(appt.day);
                                                    const targetDate = typeof day === 'string' ? new Date() : day.fullDate;
                                                    const targetDay = typeof day === 'string' ? day : day.name;

                                                    if (typeof day === 'string') {
                                                        const apptDay = apptDate.toLocaleDateString('es-ES', { weekday: 'long' }).toUpperCase();
                                                        return apptDay === targetDay.toUpperCase();
                                                    }
                                                    
                                                    return (
                                                        apptDate.getDate() === day.date &&
                                                        apptDate.getMonth() === targetDate.getMonth() &&
                                                        apptDate.getFullYear() === targetDate.getFullYear()
                                                    );
                                                })
                                                .map((appt, idx) => (
                                                    <li key={idx} className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-black dark:text-gray-100 p-3 pb-6 rounded-md shadow-xl relative">
                                                        <div className="flex flex-col justify-between items-center mt-2 mb-4">
                                                            <span className="font-medium text-center w-full">
                                                                {appt.start_time.split(':').slice(0, 2).join(':')} - {appt.end_time.split(':').slice(0, 2).join(':')}
                                                            </span>
                                                            <span className="font-medium text-center w-full">
                                                                {appt.price}$
                                                            </span>
                                                        </div>
                                                        <div className="w-full flex flex-col justify-between space-y-2 items-center text-sm">
                                                            <button
                                                                onClick={() => handleEdit(appt)}
                                                                className="text-blue-700 hover:text-blue-800 transition-colors cursor-pointer bg-blue-200 p-1 w-full rounded-sm"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(appt.id)}
                                                                className="text-red-700 hover:text-red-800 transition-colors cursor-pointer bg-red-200 p-1 w-full rounded-sm"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </div>
                                                        <span className={twMerge(
                                                            'px-2 py-1 w-[100px] border border-gray-200 dark:border-gray-800 text-center text-xs rounded-full absolute top-1/1 left-1/2 translate-y-[-50%] translate-x-[-50%] shadow-sm',
                                                            appt.status === 'disponible' && 'bg-green-100 text-green-800',
                                                            appt.status === 'reservado' && 'bg-yellow-100 text-yellow-800',
                                                            appt.status === 'completado' && 'bg-blue-100 text-blue-800',
                                                            appt.status === 'cancelado' && 'bg-red-100 text-red-800',
                                                            !['disponible', 'reservado', 'completado', 'cancelado'].includes(appt.status) && 'bg-gray-100 text-gray-800'
                                                        )}>
                                                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                                        </span>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            <AnimatePresence>
                {showDeleteConfirmModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={cancelDelete}
                    >
                        <motion.div
                            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar eliminación</h3>
                            <p className="text-gray-600 mb-6">
                                ¿Estás seguro de que deseas eliminar este horario? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de confirmación para fechas pasadas */}
            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowConfirmModal(false)}
                    >
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold text-gray-600 dark:text-gray-100 mb-4">Fecha pasada</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                No se puede crear un espacio de cita para una fecha pasada.
                                ¿Deseas crear el espacio para el mismo día pero de la próxima semana?
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-700 dark:bg-gray-700 text-gray-100 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600 rounded-md transition-colors border border-gray-200 dark:border-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmCreateForNextWeek}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Crear para la próxima semana
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Reservation() {
    return <AdminApp />;
}
