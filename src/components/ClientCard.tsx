import { MoreVertical, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface ClientCardProps {
  id: string;
  name: string;
  sport: string;
  level: string;
  nextSession?: string;
  paymentStatus: "paid" | "pending" | "overdue";
  sessionsRemaining?: number;
}

const ClientCard = ({ 
  id,
  name, 
  sport, 
  level, 
  nextSession,
  paymentStatus,
  sessionsRemaining 
}: ClientCardProps) => {
  const navigate = useNavigate();
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card 
      className="client-card"
      onClick={() => navigate(`/clients/${id}`)}
    >
      <div className="client-card__inner">
        <Avatar className="client-card__avatar">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="client-card__content">
          <div className="client-card__header">
            <div>
              <h3 className="client-card__name">{name}</h3>
              <p className="client-card__sport">{sport}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="more-button"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="icon--sm" />
            </Button>
          </div>
          
          <div className="client-card__badges">
            <Badge variant="outline">{level}</Badge>
            {sessionsRemaining && (
              <Badge variant="secondary">
                {sessionsRemaining} sessions left
              </Badge>
            )}
          </div>
          
          <div className="client-card__footer">
            {nextSession ? (
              <span className="client-card__session">Next: {nextSession}</span>
            ) : (
              <span className="client-card__session">No upcoming session</span>
            )}
            <Badge className={`payment-badge--${paymentStatus}`}>
              <DollarSign className="icon--sm" style={{ marginRight: '0.25rem' }} />
              {paymentStatus}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClientCard;
