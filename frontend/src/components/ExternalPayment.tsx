import {
    DollarSign,
    Calendar,
    Hash,
    User,
    Mail,
    Phone,
    FileText,
    Image,
    Clock,
    BadgeDollarSign,
    CheckCircle,
    XCircle,
    Loader2
} from "lucide-react";
import {motion} from "motion/react";
import useManualPayment from "@/hooks/useManualPayment";
import type {AppointmentInterface} from "@/types";
import {type JSX } from "react";
import {useSettings} from "@/hooks/useSettings.tsx";

interface ManualPaymentsProps {
    selectedAppointment: AppointmentInterface | null;
    selectedPlatform?: number | null;
}

const inputs = [
    {label: "Monto", name: "amount", type: "number", icon: DollarSign},
    {label: "Fecha de Transacción", name: "transactionDate", type: "date", icon: Calendar},
    {label: "Referencia", name: "reference", type: "text", icon: Hash},
    {label: "Nombre del Cliente", name: "client_name", type: "text", icon: User},
    {label: "Correo Electrónico", name: "client_email", type: "email", icon: Mail},
    {label: "Teléfono del Cliente", name: "client_phone", type: "tel", icon: Phone},
    {label: "Notas", name: "notes", type: "textarea", icon: FileText},
    {label: "Imagen del Pago", name: "paymentImage", type: "file", icon: Image},
]

export default function ExternalPayment({selectedAppointment}: ManualPaymentsProps) {

    const {
        formData,
        previewImage,
        handleChange,
        handleImageChange,
        handleSubmit,
        loading
    } = useManualPayment({ selectedAppointment });
    console.log(formData)
    const {allCurrencies}=useSettings()
    const date = new Date(selectedAppointment ? selectedAppointment.day : "").toLocaleDateString();
    const start = selectedAppointment?.start_time;
    const end = selectedAppointment?.end_time;

    const statusMap: Record<string, { icon: JSX.Element; label: string; color: string }> = {
        disponible: {
            icon: <CheckCircle className="text-green-500 inline"/>,
            label: "Disponible",
            color: "text-green-600"
        },
        reservado: {icon: <Loader2 className="text-blue-500 inline"/>, label: "Reservado", color: "text-blue-600"},
        completado: {
            icon: <CheckCircle className="text-emerald-500 inline"/>,
            label: "Completado",
            color: "text-emerald-600"
        },
        cancelado: {icon: <XCircle className="text-red-500 inline"/>, label: "Cancelado", color: "text-red-600"}
    };
    const status = statusMap[selectedAppointment ? selectedAppointment.status : ""];
    return (
        <div
            className="min-h-screen w-full max-md:flex max-md:flex-col flex justify-center mx-auto px-4 py-6 space-x-6 space-y-6 mt-[70px]">
            {selectedAppointment ? (
                    <div className="w-full bg-gray-100 max-w-fit size-fit p-6 border border-gray-200">
                        <h3 className="text-2xl font-semibold mb-4 text-[#bd9554]">Detalles de la Cita</h3>
                        <ul className="space-y-4 text-[#1e1e1e]">
                            <li>
                                <Calendar className="inline mr-2 text-[#bd9554]"/>
                                <strong>Fecha:</strong> {date}
                            </li>
                            <li>
                                <Clock className="inline mr-2 text-[#bd9554]"/>
                                <strong>Hora:</strong> {start} - {end}
                            </li>
                            <li>
                                <BadgeDollarSign className="inline mr-2 text-[#bd9554]" />

                                <strong>Precio:</strong> {allCurrencies?.currencies?.find(cur => cur.id === selectedAppointment.currency_id)?.code} {selectedAppointment.price}
                            </li>
                            <li>
                                {status.icon}
                                <strong className={`ml-2 ${status.color}`}>Estado:</strong> {status.label}
                            </li>
                        </ul>
                    </div>
                ) :
                (
                    <div
                        className="w-1/4 bg-gray-100 size-fit shadow-sm p-6 border border-gray-200 flex items-center justify-center">
                        <p className="text-gray-400">No hay ninguna cita seleccionada</p>
                    </div>
                )}
            <motion.div
                initial={{y: -100, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                exit={{scale: 0.5, opacity: 0}}
                className="bg-gray-100 h-fit max-w-[700px] w-full border border-gray-200 p-6 flex flex-col items-center overflow-hidden"
            >
                <h2 className="text-4xl font-bold mb-4 text-[#bd9554]">
                    Formulario de Pago Manual
                </h2>
                <p className="text-gray-600 ">
                    Una vez que hayas completado y enviado el
                    formulario, nos pondremos en contacto contigo al
                    verificar el pago.
                </p>
                { loading ? <div className="flex flex-col items-center mt-6">
                    <Loader2 className="animate-spin text-[#bd9554]" size={40}/>
                    <p className="text-gray-600 mt-2">Enviando...</p>
                </div> :
                <form
                    onSubmit={handleSubmit}
                    className="w-full py-6 grid grid-cols-2 gap-4"
                >
                    {inputs.map(({label, name, type, icon: Icon}) => (
                        <div key={name} className={name === "notes" || name === "paymentImage" ? "col-span-2" : ""}>
                            <div className="flex items-center gap-2">
                                <Icon className="text-[#bd9554]" size={20}/>
                                <label
                                    htmlFor={name}
                                    className="block text-[#1e1e1e] font-medium"
                                >
                                    {label}
                                </label>
                            </div>
                            {type === "textarea" ? (
                                <textarea
                                    id={name}
                                    name={name}
                                    style={{maxHeight: "250px", minHeight: "100px"}}
                                    value={formData[name as keyof typeof formData] as string}
                                    onChange={handleChange}
                                    className="w-full shadow-sm bg-white border border-gray-200 mt-2 p-2 text-[#1e1e1e]"
                                ></textarea>
                            ) : type === "file" ? (
                                <>
                                    <p className="text-gray-500">
                                        Sube una imagen del comprobante de pago
                                    </p>
                                    <input
                                        type="file"
                                        id={name}
                                        name={name}
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full shadow-sm border bg-white border-gray-200 mt-2 p-5 text-[#1e1e1e]"
                                    />
                                    {previewImage && (
                                        <div className="mt-4">
                                            <p className="text-[#1e1e1e] font-medium">
                                                Vista previa:
                                            </p>
                                            <img
                                                src={previewImage}
                                                alt="Vista previa del pago"
                                                className="shadow-sm p-2 w-full h-auto"
                                            />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <input
                                    type={type}
                                    id={name}
                                    name={name}
                                    value={formData[name as keyof typeof formData] as string}
                                    onChange={handleChange}
                                    className="w-full shadow-sm bg-white border border-gray-200 mt-2 p-2 text-[#1e1e1e]"
                                    disabled={name === "amount"}
                                        />
                            )}
                        </div>
                    ))}
                    <div className="col-span-2">
                        <button
                            type="submit"
                            className="bg-[#1e1e1e] h-12 text-white px-4 py-2 hover:bg-[#1e1e1ed4] transition-colors w-full cursor-pointer disabled:bg-gray-300"
                            disabled={!selectedAppointment || loading}
                        >
                            Enviar
                        </button>
                    </div>
                </form>}
            </motion.div>
        </div>
    );
}
