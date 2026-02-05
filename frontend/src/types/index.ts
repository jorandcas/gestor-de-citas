export interface AppointmentInterface {
  id: number;
  day: Date; // Ahora puede ser string o Date
  start_time: string;
  end_time: string;
  reservation: number;
  reservation_date: Date | null; // Ahora puede ser string o Date
  status: 'disponible' | 'reservado' | 'completado' | 'cancelado';
  isDeleted: boolean;
  price: number;
  currency_id?: number;
    meeting_link?: string | null;
    meetingPlatformId?: number | null;
}

export interface DayInfo {
    name: string;       // Ejemplo: "LUNES", "MARTES", etc.
    date: number;       // Día del mes (1-31)
    month: string;      // Mes en formato corto en mayúsculas (ej. "ENE", "FEB", etc.)
    fullDate: Date;     // Objeto Date completo con la fecha
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isDark: boolean;
  menuItems: MenuItem[];
  user: User;
}

export interface User {
  nombre: string;
  grupo: {
    nombre_grupo: string;
  };
}