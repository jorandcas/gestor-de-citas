import { AnimatePresence, motion } from "motion/react";
import { useSettings } from "@/hooks/useSettings.tsx";
import { useState } from "react";
import {
    Mail,
    User,
    Phone,
    FileInputIcon,
    Settings,
} from "lucide-react";
import Modal from "@/components/Modal.tsx";
import { SwitchConfigCard } from "@/components/customUI/SwitchConfigCard";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Input } from "./ui/input";

export const SettingsAdmin = () => {
    const {
        allPaymentsMethods,
        loading,
        FetchChangeStatusPaymentMethod,
        showModal,
        setShowModal,
        allMeetingPlatforms,
        inputsRegisterPlatform,
        handleChange,
        formData,
        RegisterNewMeetingPlatform,
        FetchChangeStatusPlatform,
        // allSettings,
        allCurrencies, valueOfCurrencyMain, handleSelectChange, changePhone, setValueOfPhone, changePrice, setPriceAppointment, priceAppointment, valueOfPhone
    } = useSettings();
    const [
        openSections,
        // setOpenSections
    ] = useState<{ [key: string]: boolean }>({
        pagos: false,
        plataformas: false,
        monedas: false,
        telefono: false,
        precio: false
    });

    // const toggleSection = (section: string) => {
    //     setOpenSections((prev) => ({
    //         ...prev,
    //         [section]: !prev[section],
    //     }));
    // };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center space-y-6"
            >
                <AnimatePresence>
                    {showModal && (
                        <Modal setShowModal={setShowModal} className="max-w-md" title={'Registrar nueva plataforma'}>
                            <div className='max-w-md w-full mx-auto mb-4'>
                                {inputsRegisterPlatform.map((input) => {
                                    // Selecciona el icono según el tipo de input
                                    let IconComponent = FileInputIcon;
                                    if (input.type === "email") IconComponent = Mail;
                                    if (input.type === "text" && input.name.toLowerCase().includes("nombre")) IconComponent = User;
                                    if (input.type === "tel") IconComponent = Phone;

                                    return (
                                        <div key={input.name} className="mb-4">
                                            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                                                htmlFor={input.name}>
                                                {input.label}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                                    <IconComponent size={18} />
                                                </span>
                                                <input
                                                    type={input.type}
                                                    name={input.name}
                                                    placeholder={input.placeholder}
                                                    value={formData[input.name as keyof typeof formData] || ''}
                                                    onChange={handleChange}
                                                    className="pl-10 pr-3 py-2 w-full rounded border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition cursor-pointer"
                                    onClick={() => RegisterNewMeetingPlatform()}
                                >
                                    Registrar plataforma
                                </button>
                            </div>
                        </Modal>
                    )}
                </AnimatePresence>
                <h2 className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-6 flex items-center gap-2">
                    <Settings className="text-blue-500 w-10 h-10" />
                    Configuraciones del sistema
                </h2>
                <div className="w-full">
                    <div className="flex flex-col items-start bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                        <div>
                            <span
                                className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
                                Información Financiera
                            </span>
                            <span
                                className="text-base font-semibold text-gray-500 dark:text-gray-200 flex items-center gap-2">
                                Establece la moneda base del sistema y el precio por defecto de los servicios.
                            </span>
                        </div>
                        <div className="flex items-center gap-2 w-full gap-4 mt-4">
                            <span className="w-fit min-w-[110px]">Moneda Base</span>
                            <Select defaultValue={valueOfCurrencyMain ?? ''} onValueChange={(value) => handleSelectChange(value)}>
                                <SelectTrigger id="status-select" className="min-w-[250px] pl-6 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:bg-white dark:focus:bg-gray-600/80"
                                value={valueOfCurrencyMain ?? ''}
                                >
                                    <SelectValue placeholder="Seleccionar moneda" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {allCurrencies?.currencies?.map((item) => (
                                            <SelectItem key={item.code} value={item.code}>{item.name} - {item.code}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>

                        </div>
                        <div className="flex items-center gap-2 w-full gap-4 mt-4">
                            <span className="w-fit min-w-[110px]">Precio por Cita</span>
                            <Input
                                type="number"
                                value={priceAppointment ?? ''}
                                onChange={(e) => setPriceAppointment(parseFloat(e.target.value))}
                                placeholder="Precio por Cita"
                                className="w-auto min-w-[250px] bg-gray-100 dark:bg-gray-700 pl-6 focus:bg-white dark:focus:bg-gray-600/80"
                            />
                            <button
                                className="
                                bg-blue-500 hover:bg-blue-600
                                text-white
                                font-semibold
                                py-1.5
                                px-4
                                rounded
                                cursor-pointer
                            "
                                onClick={changePrice}
                            >
                                Guardar
                            </button>
                        </div>
                        <div className="h-[1px] bg-gray-200 dark:bg-gray-700 w-full my-6" ></div>
                        <div>
                            <span
                                className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-1">
                                Detalles de Contacto
                            </span>
                            <span
                                className="text-base font-semibold text-gray-500 dark:text-gray-200 flex items-center gap-2">
                                Configura el número de teléfono que se muestra a los clientes.
                            </span>
                        </div>
                        <div className="flex items-center gap-2 w-full gap-4 mt-4">
                            <span className="w-fit min-w-[110px]">Número de Teléfono</span>
                            <Input
                                type="text"
                                value={valueOfPhone ?? ''}
                                onChange={(e) => setValueOfPhone(e.target.value)}
                                placeholder="Precio por Cita"
                                className="w-auto min-w-[250px] bg-gray-100 dark:bg-gray-700 pl-6 focus:bg-white dark:focus:bg-gray-600/80"
                            />
                            <button
                                className="
                                bg-blue-500 hover:bg-blue-600
                                text-white
                                font-semibold
                                py-1.5
                                px-4
                                rounded
                                cursor-pointer
                            "
                                onClick={changePhone}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <span
                            className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            Métodos de pago disponibles
                        </span>
                        {/* <button
                            onClick={() => toggleSection("pagos")}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                            title={openSections.pagos ? "Cerrar" : "Abrir"}
                        >
                            {openSections.pagos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button> */}
                    </div>
                    <div
                        className={`transition-all duration-500 overflow-hidden ${openSections.pagos ? 'max-h-0' : 'max-h-screen'} mb-4`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allPaymentsMethods?.data?.map((method) => (
                                <SwitchConfigCard
                                    key={method.id}
                                    id={method.id}
                                    name={method.name}
                                    description={method.description}
                                    is_active={method.is_active}
                                    onStatusChange={FetchChangeStatusPaymentMethod}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <span
                            className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            Plataformas de reuniones disponibles
                        </span>
                        {/* <button
                            onClick={() => toggleSection("plataformas")}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                            title={openSections.pagos ? "Cerrar" : "Abrir"}
                        >
                            {openSections.pagos ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button> */}
                    </div>
                    <div
                        className={`transition-all duration-500 overflow-hidden ${openSections.plataformas ? 'max-h-0' : 'max-h-screen'} mb-4`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {
                                allMeetingPlatforms?.MeetingPlatforms?.map((platform) => (
                                    <SwitchConfigCard
                                        key={platform.id}
                                        id={platform.id}
                                        name={platform.name}
                                        description={platform.description}
                                        is_active={platform.is_active}
                                        onStatusChange={FetchChangeStatusPlatform}
                                    />
                                ))
                            }
                        </div>
                        <button
                            className="
                                bg-blue-500 hover:bg-blue-600
                                text-white
                                font-semibold
                                py-2
                                px-4
                                rounded
                                mt-4
                                cursor-pointer
                            "
                            onClick={() => setShowModal(true)}
                        >
                            Registrar nueva plataforma
                        </button>
                    </div>


                </div>
            </motion.div>
        </div>
    );
};
