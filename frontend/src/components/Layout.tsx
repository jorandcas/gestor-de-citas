import React, {useState, useMemo} from 'react';
import {CalendarDays, HandCoins, Settings,ClipboardClock, Home} from 'lucide-react';
import {useTheme} from '../contexts/ThemeContext.tsx';
import {Toaster} from 'react-hot-toast';
import type {MenuItem} from '../types';
import Sidebar from './Sidebar';
import {useSession} from '@clerk/clerk-react';
import {LayoutHeader} from './LayoutHeader';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({children}) => {
    const {isDark} = useTheme();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const {session} = useSession();
    const emailAdminOfEnv = import.meta.env.VITE_ADMIN_EMAIL;
    const userGroupId = (session?.user.primaryEmailAddress?.emailAddress === emailAdminOfEnv) ? 1 : 2;
    const menuItems: MenuItem[] = useMemo(() => {
        const baseItems: MenuItem[] = [];


        if (userGroupId === 1) { // Administrativo
            return [
                ...baseItems,
                {
                    id: 'home',
                    label: 'Inicio',
                    icon: Home,
                    path: '/',
                },
                {
                    id: 'horarios',
                    label: 'Horarios',
                    icon: CalendarDays,
                    path: '/',
                    badge: 0// Ejemplo de badge para notificaciones
                },
                // {
                //   id:'campañas',
                //   label: 'Campañas',
                //   icon: GalleryVerticalEnd,
                //   path: '/campaigns',
                // },
                {
                    id:'appointments',
                    label:'Gestión de Citas',
                    icon: ClipboardClock,
                    path: '/management-appointments',
                    badge: 0
                },
                {
                    id: 'management-of-payment',
                    label: 'Gestión de pagos',
                    icon: HandCoins,
                    path: '/management-of-payment',
                    badge: 0// Ejemplo de badge para notificaciones
                },
                {
                    id:'meeting',
                    label: 'Plataformas de reunión',
                    icon: CalendarDays,
                    path: '/meeting',
                    badge: 0// Ejemplo de badge para notificaciones
                },
                {
                    id: 'configuracion',
                    label: 'Configuración',
                    icon: Settings,
                    path: '/configuracion',
                    badge: 0// Ejemplo de badge para notificaciones
                },
            ];
        } else {
            return [
                ...baseItems,
                {
                    id: 'home',
                    label: 'Inicio',
                    icon: Home,
                    path: '/',
                },
                {
                    id: 'appointments',
                    label: 'Mis citas',
                    icon: CalendarDays,
                    path: '/user/appointments',
                },
                {
                    id: 'payment-history',
                    label: 'Historial de pagos',
                    icon: HandCoins,
                    path: '/user/payment-history',
                }
            ];
        }

        return []; // Si no hay sesión o grupo desconocido, no mostrar ítems
    }, []);


    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={handleSidebarToggle}
                menuItems={menuItems}
                isDark={isDark}
                user={{
                    nombre: `${session?.publicUserData.firstName} ${session?.publicUserData.lastName}`,
                    grupo: {nombre_grupo: session?.user.emailAddresses[0].emailAddress === import.meta.env.VITE_ADMIN_EMAIL ? "Administrador" : "Usuario"}
                }} // Pasar el usuario actual al Sidebar
            />
            <div className="flex flex-col w-full">
                <LayoutHeader session={session}/>
                <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto w-full">
                    {children}
                </main>
            </div>
            <Toaster position="bottom-right" toastOptions={{
                style: isDark ? {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                } : {
                    borderRadius: '10px',
                    background: '#fff',
                    color: '#000',
                }
            }}/>
        </div>
    );
};

{/* <div className="flex h-screen bg-gray-50">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={handleSidebarToggle}
            menuItems={menuItems}
            user={session.user}
          />
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <AnimatePresence mode="wait">

              </AnimatePresence>
            </div>
          </main>
        </div> */
}