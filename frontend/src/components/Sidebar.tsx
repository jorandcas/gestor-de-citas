import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, CreditCard } from 'lucide-react';
import type { SidebarProps } from '../types/index';
import { twMerge } from 'tailwind-merge';
import PayPalIcon from '@/components/icons/paypal';
import StripeIcon from '@/components/icons/stripe';

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, menuItems, user }) => {
    const [openGestionOfPayment, setOpenGestionOfPayment] = React.useState(false);
    const paymentMethods = [
        {
            id: "external-payment",
            label: "Pago Externo",
            path: "/management-of-external-payment",
            icon: CreditCard,
            badge: 0
        },
        {
            id: "paypal",
            label: "PayPal",
            path: "/management-of-paypal",
            icon: PayPalIcon,
            badge: 0
        },
        {
            id: "stripe",
            label: "Stripe",
            path: "/management-of-stripe",
            icon: StripeIcon,
            badge: 0
        }
    ]
    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 70 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white dark:bg-gray-800 dark:border-gray-700 shadow-xl border-r border-gray-200 flex flex-col relative z-10"
        >
            {/* Header with Logo */}
            <div
                className={twMerge("border-b dark:border-gray-700 border-gray-200 h-[64.8px] flex items-center justify-center", isCollapsed ? "px-2 py-3" : "py-2")}>
                <div className="flex items-center justify-center gap-x-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            className={twMerge("flex flex-col justifty-center transition-all items-center w-full animate-slideInLeft text-center w-50", isCollapsed && 'animate-slideOutLeft')}
                        >
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Becerra Manchinelly</h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400 w-40 text-center mx-auto">Firma Legal
                                Mexicana</p>
                        </motion.div>
                    </AnimatePresence>

                    {isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2, delay: 0.5 }}
                            className="mx-auto transition-all"
                        >
                            <h2>logo</h2>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-shadow z-20"
            >
                <motion.div
                    animate={{ rotate: isCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                </motion.div>
            </button>

            {/* Navigation Menu */}
            <nav className="flex-1 py-6">
                <ul className="space-y-2 px-3">
                    {menuItems.map((item, index) => (
                        <motion.li
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {item.id === "management-of-payment" ? (
                                <>
                                    <button
                                        className={
                                            `flex w-full items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${openGestionOfPayment
                                                ? 'bg-blue-800 text-white shadow-lg'
                                                : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 hover:text-gray-900'
                                            }`
                                        }
                                        onClick={() => setOpenGestionOfPayment(!openGestionOfPayment)}
                                    >
                                        <>
                                            <div
                                                className={`flex-shrink-0 ${openGestionOfPayment ? 'text-white' : 'text-gray-500 dark:text-gray-100 group-hover:text-gray-700'}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex items-center justify-between flex-1"
                                                    >
                                                        <span className="font-medium">{item.label}</span>
                                                        {item.badge && item.badge !== 0 && item.badge > 0 ? (
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className={`px-2 py-1 text-xs rounded-full ${openGestionOfPayment
                                                                    ? 'bg-white text-blue-600'
                                                                    : 'bg-red-500 text-white'
                                                                    }`}
                                                            >
                                                                {item.badge}
                                                            </motion.span>
                                                        ) : null}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Tooltip for collapsed state */}
                                            {isCollapsed && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileHover={{ opacity: 1, x: 0 }}
                                                    className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
                                                >
                                                    {item.label}
                                                    {item.badge && item.badge !== 0 && item.badge > 0 && (
                                                        <span
                                                            className="ml-2 px-1.5 py-0.5 bg-red-500 text-xs rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            )}
                                        </>
                                    </button>
                                    <div
                                        className={twMerge("flex flex-col max-h-[0px] overflow-hidden transition-all duration-200 ml-2", isCollapsed && "ml-0", openGestionOfPayment && "max-h-[500px] mt-2 ")}>
                                        <div
                                            className={twMerge("flex flex-col h-auto overflow-hidden space-y-2", isCollapsed && "ml-0")}>
                                            {paymentMethods.map((item, index) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <NavLink
                                                        to={item.path}
                                                        className={({ isActive }) =>
                                                            `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                                                                ? 'bg-blue-600 text-white shadow-lg'
                                                                : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 hover:text-gray-900'
                                                            }`
                                                        }
                                                    >
                                                        {({ isActive }) => (
                                                            <>
                                                                <div
                                                                    className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-100 group-hover:text-gray-700'}`}>
                                                                    <item.icon className="w-5 h-5" />
                                                                </div>

                                                                <AnimatePresence mode="wait">
                                                                    {!isCollapsed && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, x: -10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            exit={{ opacity: 0, x: -10 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="flex items-center justify-between flex-1"
                                                                        >
                                                                            <span
                                                                                className="font-medium">{item.label}</span>
                                                                            {item.badge && item.badge !== 0 && item.badge > 0 ? (
                                                                                <motion.span
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className={`px-2 py-1 text-xs rounded-full ${isActive
                                                                                        ? 'bg-white text-blue-600'
                                                                                        : 'bg-red-500 text-white'
                                                                                        }`}
                                                                                >
                                                                                    {item.badge}
                                                                                </motion.span>
                                                                            ) : null}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>

                                                                {/* Tooltip for collapsed state */}
                                                                {isCollapsed && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        whileHover={{ opacity: 1, x: 0 }}
                                                                        className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
                                                                    >
                                                                        {item.label}
                                                                        {item.badge && item.badge !== 0 && item.badge > 0 && (
                                                                            <span
                                                                                className="ml-2 px-1.5 py-0.5 bg-red-500 text-xs rounded-full">
                                                                                {item.badge}
                                                                            </span>
                                                                        )}
                                                                    </motion.div>
                                                                )}
                                                            </>
                                                        )}
                                                    </NavLink>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    onClick={() => {
                                        setOpenGestionOfPayment(false);
                                    }}
                                    className={({ isActive }) =>
                                        `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group relative ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-700 dark:text-gray-100 hover:bg-gray-100 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div
                                                className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-100 group-hover:text-gray-700'}`}>
                                                <item.icon className="w-5 h-5" />
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {!isCollapsed && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex items-center justify-between flex-1"
                                                    >
                                                        <span className="font-medium">{item.label}</span>
                                                        {item.badge && item.badge !== 0 && item.badge > 0 ? (
                                                            <motion.span
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className={`px-2 py-1 text-xs rounded-full ${isActive
                                                                    ? 'bg-white text-blue-600'
                                                                    : 'bg-red-500 text-white'
                                                                    }`}
                                                            >
                                                                {item.badge}
                                                            </motion.span>
                                                        ) : null}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Tooltip for collapsed state */}
                                            {isCollapsed && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    whileHover={{ opacity: 1, x: 0 }}
                                                    className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none"
                                                >
                                                    {item.label}
                                                    {item.badge && item.badge !== 0 && item.badge > 0 && (
                                                        <span
                                                            className="ml-2 px-1.5 py-0.5 bg-red-500 text-xs rounded-full">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </motion.li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <AnimatePresence mode="wait">
                    {!isCollapsed ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center space-x-3"
                        >
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">AD</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.grupo?.nombre_grupo ? user.grupo?.nombre_grupo : ''}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center"
                        >
                            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                <span
                                    className="text-white font-semibold text-sm">{user.nombre[0] + user.nombre[1]}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.aside>
    );
};

export default React.memo(Sidebar);