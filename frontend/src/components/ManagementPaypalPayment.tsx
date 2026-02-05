import usePaypalPayment from '@/hooks/usePaypalPayment';
import { CheckCircle, Clock, SearchIcon, XCircle } from 'lucide-react';
import { Label } from './ui/label';
import { Select, SelectGroup, SelectItem, SelectLabel } from './ui/select';
import { SelectContent, SelectTrigger, SelectValue } from '@radix-ui/react-select';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'motion/react';
import ModalOfPaypalPaymentToSeeDetails from './ModalOfPaypalPaymentToSeeDetails';

const buttonsActionsOfVerifyPayment = [
    {
        label: "Rechazar",
        value: "fallido",
        style: "bg-red-500",
        icon: <XCircle className='w-4 h-4 inline mr-1' />
    },
    {
        label: "Aceptar",
        value: "completado",
        style: "bg-green-500",
        icon: <CheckCircle className="w-4 h-4 inline mr-1" />
    }
    ,
    {
        label: "Pendiente",
        value: "pendiente",
        style: "bg-yellow-500",
        icon: <Clock className="w-4 h-4 inline mr-1" />
    },
    {
        label: "Reembolsado",
        value: "reembolsado",
        style: "bg-orange-500",
        icon: <Clock className="w-4 h-4 inline mr-1" />
    }
]
export default function ManagementPaypalPayment() {
    const { dataFiltered,filter,setFilter, showModal,setShowModal, fetchPaypalPaymentById,infoPaypalPaymentById,setNewStatusOfPaypalPayment,handleSubmitChangeStatusOfManualPayment } = usePaypalPayment();
    return (
        <div className="container mx-auto px-4 py-6 ">
            <AnimatePresence>
                {showModal && (
                    <ModalOfPaypalPaymentToSeeDetails className="max-w-4xl" setShowModal={setShowModal} infoOfPaypalPaymentById={infoPaypalPaymentById} setNewStatusOfPaypalPayment={setNewStatusOfPaypalPayment} buttonsActionsOfVerifyPayment={buttonsActionsOfVerifyPayment}
                        handleSubmitChangeStatusOfManualPayment={handleSubmitChangeStatusOfManualPayment}
                    />
                )}
            </AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl w-full mx-auto rounded-lg flex flex-col items-center"
            >
                <div className="max-md:flex-col max-md:items-start mb-6 flex items-center justify-between w-full">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                            Gestión de Pagos con Paypal
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">En esta sección puedes gestionar los pagos realizados con Paypal.</p>
                    </div>
                    <div>
                        <div className="flex gap-4">
                            <Label htmlFor="status-select" className="px-1 flex-1 gap-3 flex flex-col justify-center items-start">
                                Filtros
                                <Select defaultValue={filter} onValueChange={(value) => setFilter(value)}>
                                    <SelectTrigger id="status-select" className="w-full min-w-[180px] bg-white">
                                        <SelectValue placeholder="Seleccionar estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Estado</SelectLabel>
                                            <SelectItem value="all">Todos</SelectItem>
                                            <SelectItem value="pendiente">Pendiente</SelectItem>
                                            <SelectItem value="completado">Aprobado</SelectItem>
                                            <SelectItem value="fallido">Rechazado</SelectItem>
                                            <SelectItem value="reembolsado">Reembolsado</SelectItem>
                                            <SelectItem value="reembolso">Reembolso</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Label>
                        </div>
                    </div>
                </div>
                {dataFiltered && dataFiltered.length > 0 ? (
                    <ul className="w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {dataFiltered.map((payment) => (
                            <motion.li
                                key={payment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.2 }}
                                className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => {
                                    fetchPaypalPaymentById(payment.id);
                                    setShowModal(true);
                                }}
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <span className="font-semibold text-gray-800 dark:text-white w-10 truncate">
										{
											payment.id
										}
									</span>
                                    <span className="font-semibold text-gray-800 dark:text-white w-48 truncate">
                                        {payment.client_name.slice(0, 25)}
                                    </span>
                                    <span
                                        className={twMerge(
                                            "px-3 py-1 text-sm font-medium rounded-full flex justify-center items-center",
                                            payment.status === "reembolsado" && "bg-orange-100 text-orange-600",
                                            payment.status === "reembolso" && "bg-purple-100 text-purple-600",
                                            payment.status === "pendiente" && "bg-yellow-100 text-yellow-600",
                                            payment.status === "completado" && "bg-green-100 text-green-600",
                                            !["reembolsado", "reembolso", "pendiente", "completado"].includes(payment.status) && "bg-red-100 text-red-600"
                                        )}
                                    >
                                        {
                                            payment.status === "pendiente" ? (
                                                <Clock className="w-4 h-4 inline mr-1" />
                                            ) : payment.status === "completado" ? (
                                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                            ) : (
                                                <XCircle className="w-4 h-4 inline mr-1" />
                                            )
                                        }
                                        {payment.status}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        <strong>Monto:</strong> {payment.amount} {payment.currency}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                        <strong>Referencia:</strong> {payment.reference.slice(0, 25)}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">
                                        <strong>Fecha:</strong> {new Date(payment.transactionDate).toLocaleDateString()}
                                    </span>
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="mt-2 md:mt-0 px-4 py-2 bg-gray-600 dark:bg-gray-600 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-700 transition-colors duration-300"
                                        onClick={e => {
                                            e.stopPropagation();
                                            fetchPaypalPaymentById(payment.id);
                                            setShowModal(true);
                                        }}
                                    >
                                        Ver Detalles
                                    </motion.button>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="overflow-hidden flex flex-col items-center justify-center mt-16"
                    >

                        <div className="bg-gray-200 w-fit p-4 rounded-full border border-gray-200 mb-6">
                            <SearchIcon className="w-8 h-8 mx-auto text-gray-400" />
                        </div>
                        <p className="text-center text-gray-600 text-lg mb-3">
                            No hay pagos con paypal registrados
                        </p>
                        <p className="text-sm text-center text-gray-500">cuando realicen un pago con paypal, aparecerá aquí</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    )
}
