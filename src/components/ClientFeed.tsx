import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface FeedMessage {
  id: string;
  title: string;
  content: string;
  created_at: string;
  coach_id: string;
  coach?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

const ClientFeed = () => {
  const { user } = useUserRole();
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    // Get messages from all coaches this client is connected to
    const { data } = await supabase
      .from("feed_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch coach profiles for each message
      const coachIds = [...new Set(data.map(m => m.coach_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", coachIds);

      const messagesWithCoach = data.map(msg => ({
        ...msg,
        coach: profiles?.find(p => p.id === msg.coach_id)
      }));

      setMessages(messagesWithCoach);
    }
    setLoading(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="feed">
      <h2 className="client-portal__section-title">Coach Updates</h2>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <MessageSquare className="empty-state__icon" />
          <p>No updates yet</p>
          <p className="empty-state__hint">Connect with coaches to see their announcements</p>
        </div>
      ) : (
        <div className="feed__list">
          {messages.map((msg) => (
            <Card key={msg.id} className="feed__card">
              <CardContent className="feed__card-content">
                {msg.coach && (
                  <div className="feed__card-coach">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.coach.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(msg.coach.first_name, msg.coach.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="feed__card-coach-name">
                      {msg.coach.first_name} {msg.coach.last_name}
                    </span>
                  </div>
                )}
                <h3 className="feed__card-title">{msg.title}</h3>
                <p className="feed__card-text">{msg.content}</p>
                <span className="feed__card-date">
                  {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientFeed;
