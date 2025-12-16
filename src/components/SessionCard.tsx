import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionCardProps {
  clientName: string;
  time: string;
  duration: string;
  location?: string;
  type: string;
  status?: "upcoming" | "completed" | "cancelled";
}

const SessionCard = ({ 
  clientName, 
  time, 
  duration, 
  location, 
  type,
  status = "upcoming" 
}: SessionCardProps) => {
  const statusColors = {
    upcoming: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{clientName}</h3>
          <Badge variant="secondary" className="mt-1">
            {type}
          </Badge>
        </div>
        <Badge className={statusColors[status]}>
          {status}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{time} • {duration}</span>
        </div>
        {location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SessionCard;
