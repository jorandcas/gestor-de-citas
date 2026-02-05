import React from "react";
import type { LucideIcon } from "lucide-react";

interface PaymentInfoItemProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  className?: string;
}

const PaymentInfoItem: React.FC<PaymentInfoItemProps> = ({
  icon: Icon,
  label,
  value,
  className = "",
}) => {
  return (
    <div className={className}>
      <p className="text-sm dark:text-gray-100 text-gray-700 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />
        <strong>{label}:</strong>
      </p>
      <p className="text-gray-900 dark:text-gray-100 text-ellipsis ml-7">
        {value}
      </p>
    </div>
  );
};

export default PaymentInfoItem;
