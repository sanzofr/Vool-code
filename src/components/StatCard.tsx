import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "primary" | "secondary" | "success" | "warning";
}

const StatCard = ({ title, value, icon: Icon, trend, color = "primary" }: StatCardProps) => {
  return (
    <Card className="stat-card">
      <div className="stat-card__inner">
        <div className="stat-card__content">
          <p className="stat-card__title">{title}</p>
          <p className="stat-card__value">{value}</p>
          {trend && <p className="stat-card__trend">{trend}</p>}
        </div>
        <div className={`stat-card__icon stat-card__icon--${color}`}>
          <Icon />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
