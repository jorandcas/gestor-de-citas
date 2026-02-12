import {AnimatePresence, motion} from "motion/react"
import {LoaderCircle, SquareChartGantt, X} from "lucide-react"
import {Moon, Sun, Bell, CheckCircle, XCircle, AlertTriangle, Info, Eye} from "lucide-react"
import type {Notification} from "../types/notifications"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {SignedIn, SignedOut, SignInButton, UserButton} from '@clerk/clerk-react';
import {TZDate} from "react-day-picker"
import useHeader from "@/hooks/useHeader"
import { useNavigate } from "react-router-dom"

const ZONE = import.meta.env.VITE_ZONE_TIME || 'America/Caracas';


function LayoutHeader({session}: { session: any }) {
    const {
		isDark,
		toggleTheme,
		notifications,
		unreadCount,
		loading,
		handleSelectNotification,
		handleCloseNotificationModal,
		showNotificationModal,
		selectedNotification,
		markAsRead,
		setShowNotificationModal,
        paymentMethods
	} = useHeader(session);
    const navigate = useNavigate();
    // detectar si es admin o user
    const emailAdminOfEnv = import.meta.env.VITE_ADMIN_EMAIL;
    const userGroupRole = (session?.user.primaryEmailAddress?.emailAddress === emailAdminOfEnv) ? 1 : 2;

    // function proccessNotificationModalBody(notification: Notification) {
    //     const body = notification.modalBody.split('\n');
    //     const result: { [key: string]: string } = {};
    //     body.forEach(element => {
    //         let resultado = element.replaceAll("|", "").trimStart();
    //         let [nombre, valor] = resultado.split(":");
    //         if (typeof valor === 'string') {
    //             const valorSinEspacios = valor.trimStart().trimEnd();
    //             result[nombre] = valorSinEspacios;
    //         }
    //     });
    //     return result
    // }
    // console.log('selectedNotification', selectedNotification ? proccessNotificationModalBody(selectedNotification) : null);

    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="mx-auto px-4 sm:px-6 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    <motion.button
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <SquareChartGantt className="w-6 h-6 text-white"/>
                        </div>
                        <div className="text-left">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Gestión de Citas
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sistema de gestión de asesorías
                            </p>
                        </div>
                    </motion.button>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center">
                            <SignedOut>
                                <SignInButton mode="modal">
                                    <button className="sign-in-button">Iniciar Sesión</button>
                                </SignInButton>
                            </SignedOut>
                            <SignedIn>
                                <UserButton/>
                            </SignedIn>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <div
                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative">
                                    <Bell className="w-5 h-5"/>
                                    {unreadCount > 0 && (
                                        <span
                                            className="absolute top-0 right-0 translate-x-1/2 -translate-y-[35%] inline-flex items-center justify-center px-1 py-1 min-w-6 min-h-6 text-xs font-medium text-white bg-red-500 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="dark:bg-gray-800 p-0 min-w-[300px] w-full max-w-[400px] border-gray-200 dark:border-gray-700 max-h-[400px] relative"
                                align="end" side="bottom">
                                <DropdownMenuLabel
                                    className="flex justify-between items-center sticky top-0 z-10 w-full bg-gray-100 dark:bg-gray-700 px-2 py-1.5">
                                    <span>Notificaciones</span>
                                    <div>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div
                                                    title="mark as read"
                                                    onClick={() => {
                                                        markAsRead(notifications.filter(n => !n.seen).map(n => n.id))

                                                    }}
                                                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                    <Eye className="w-5 h-5"/>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="dark:text-gray-800 text-gray-100">Marcar todas como
                                                    leídas</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </DropdownMenuLabel>
                                <div className="p-1.5 space-y-1.5">
                                    {notifications.length > 0 ? notifications.map((notification) => (
                                        <NotificationItem key={notification.id} notification={notification}
                                        openModal={handleSelectNotification}/>
                                    )) : loading ? (
                                        <div className="p-2 flex items-center justify-center space-x-2">
                                            <LoaderCircle className="w-6 h-6 text-gray-500 animate-spin" />
                                            <span className="text-gray-500">Cargando...</span>
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            <p className="text-gray-500 text-center">No hay notificaciones
                                                pendientes</p>
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <motion.button
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {isDark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                        </motion.button>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {showNotificationModal && (
                    <motion.div
                        className="fixed inset-0 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                                    onClick={() => setShowNotificationModal(false)}
                                    className='fixed backdrop-blur-xs inset-0 bg-gray-600/50 h-full w-full'>

                        </motion.div>
                        <motion.div initial={{y: -100, opacity: 0}} animate={{y: 0, opacity: 1}}
                                    exit={{scale: 0.5, opacity: 0}}
                                    className="relative p-6 bg-white border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800 rounded-lg max-w-lg w-full">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Notificación</h2>
                                <button
                                    title="close"
                                    onClick={() => handleCloseNotificationModal()}
                                        className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200">
                                    <X className="w-5 h-5"/>
                                </button>
                            </div>
                            {selectedNotification && selectedNotification?.modalBody ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedNotification.modalBody }}>
                                </div>
                            ) : (
                                 <div className="mt-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium">Título:</div>
                                        <div>{selectedNotification?.title}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium">Mensaje:</div>
                                        <div>{selectedNotification?.body}</div>
                                    </div>
                                    {selectedNotification?.PaymentsAppointments && (
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                                            <div className="font-medium mb-2">Detalles del pago:</div>
                                            <div className="space-y-2 text-sm">
                                                <div><strong>Monto:</strong> ${selectedNotification?.PaymentsAppointments.amount} {selectedNotification?.PaymentsAppointments.currency}</div>
                                                <div><strong>Estado:</strong> {selectedNotification?.PaymentsAppointments.status}</div>
                                                <div><strong>Metodo de pago:</strong> {paymentMethods.find((pm) => pm.id === selectedNotification?.PaymentsAppointments.paymentMethodId)?.name}</div>
                                                <div><strong>ID de transacción:</strong> {selectedNotification?.PaymentsAppointments.reference || 'N/A'}</div>
                                                <div><strong>Fecha de transacción:</strong> {new Date(selectedNotification?.PaymentsAppointments.transactionDate).toLocaleDateString() || 'N/A'}</div>
                                                <div><strong>Notas:</strong> {selectedNotification?.PaymentsAppointments.notes || 'N/A'}</div>
                                                <div><strong>Email:</strong> {selectedNotification?.PaymentsAppointments.client_email || 'N/A'}</div>
                                                <div><strong>Nombre:</strong> {selectedNotification?.PaymentsAppointments.client_name || 'N/A'}</div>
                                                <div><strong>Telefono:</strong> {selectedNotification?.PaymentsAppointments.client_phone || 'N/A'}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <button
                                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                onClick={
                                    ()=>{
                                        if(userGroupRole === 1){
                                            selectedNotification?.PaymentsAppointments.paymentMethodId === 3 ?
                                        navigate('/management-of-external-payment',{
                                            state:{paymentId:selectedNotification.payment_id}
                                        }) : selectedNotification?.PaymentsAppointments.paymentMethodId === 2 ? navigate('/management-of-paypal',{
                                            state:{paymentId:selectedNotification.PaymentsAppointments.paymentMethodId}
                                        }) : navigate('/management-of-stripe',{
                                            state:{paymentId:selectedNotification?.PaymentsAppointments.paymentMethodId}
                                        }),
                                        setShowNotificationModal(false)
                                    }else{
                                        navigate(`/user/payment-history/${selectedNotification?.payment_id}`)
                                        setShowNotificationModal(false)
                                    }
                                    }
                                }
                            >
                                ver pago
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}

export {LayoutHeader}

// Función para obtener el ícono según el tipo de notificación
const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = 'w-4 h-4';
    switch (type) {
        case 'success':
            return <CheckCircle className={`${iconClass} text-green-500`}/>;
        case 'error':
            return <XCircle className={`${iconClass} text-red-500`}/>;
        case 'warning':
            return <AlertTriangle className={`${iconClass} text-yellow-500`}/>;
        case 'info':
            return <Info className={`${iconClass} text-blue-500`}/>;
        default:
            return <Bell className={`${iconClass} text-gray-500`}/>;
    }
};

// Función para formatear la fecha de forma relativa (ej: "hace 5 minutos")
const formatRelativeTime = (dateString: string | Date) => {
    // Asegurarnos de que tengamos un objeto Date
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
        console.error('Fecha inválida:', dateString);
        return 'Fecha inválida';
    }

    const now = new TZDate(new Date(), ZONE);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} d`;

    // Usar toLocaleDateString con la zona horaria correcta
    return new TZDate(date, ZONE).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

function NotificationItem({notification, openModal}: {
    notification: Notification,
    openModal: (notification: Notification) => void
}) {
    const { markAsRead } = useHeader(null);
    return (
        <DropdownMenuItem
            className={`relative flex items-start p-3 space-x-3 cursor-pointer bg-gray-100 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${!notification.seen ? 'bg-blue-50 dark:bg-blue-900/40' : ''}`}
            onClick={() => {
                openModal(notification);
                markAsRead([notification.id]);
            }}
        >
            <div className="flex-shrink-0 mt-0.5">
                <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                    {getNotificationIcon(notification.type)}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${!notification.seen ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                        {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                        {formatRelativeTime(notification.createdAt)}
                    </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 text-wrap break-words">
                    {notification.body}
                </p>
                {notification.payment_id && (
                    <div className="mt-2">
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Pago #{notification.payment_id}
                        </span>
                    </div>
                )}
            </div>
            {!notification.seen && (
                <div className="absolute right-3 top-3 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
        </DropdownMenuItem>
    )
}