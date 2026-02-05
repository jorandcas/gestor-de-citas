import { CheckCircle, XCircle, CreditCard } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SwitchConfigCardProps {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  onStatusChange: (id: number, currentStatus: boolean) => void;
}

export function SwitchConfigCard({
  id,
  name,
  description,
  is_active,
  onStatusChange,
}: SwitchConfigCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 rounded-lg shadow flex justify-between items-center gap-2">
      <div className="flex flex-col items-start justify-center gap-2">
        <div className="flex items-center justify-center space-x-5">
          <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <CreditCard size={20} />
            {name}
          </h3>
          <div className="flex items-center gap-2">
            {is_active ? (
              <>
                <CheckCircle className="text-green-500" size={18} />
                <span className="text-green-700 font-medium">Activo</span>
              </>
            ) : (
              <>
                <XCircle className="text-red-500" size={18} />
                <span className="text-red-700 font-medium">Inactivo</span>
              </>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 truncate ">{description.length > 40 ? `${description.slice(0, 50)}...` : description }</p>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={is_active}
          onCheckedChange={() => onStatusChange(id, is_active)}
          className="scale-125 cursor-pointer"
        />
      </div>
    </div>
  );
}