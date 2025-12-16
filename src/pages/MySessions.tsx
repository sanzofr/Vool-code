import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import ClientMobileNav from "@/components/ClientMobileNav";
import logo from "@/assets/logo.jpg";
import "@/styles/app.css";

interface Session {
  id: string;
  session_date: string;
  session_type: string;
  duration: number;
  location: string | null;
  status: string;
  coach_id: string;
  coach?: {
    first_name: string;
    last_name: string;
  };
}

interface BookingRequest {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
}

const MySessions = () => {
  const { user } = useUserRole();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch sessions synced to this client
    const { data: sessionsData } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_client_id", user?.id)
      .order("session_date", { ascending: true });

    if (sessionsData && sessionsData.length > 0) {
      // Get coach info
      const coachIds = [...new Set(sessionsData.map(s => s.coach_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", coachIds);

      const sessionsWithCoach = sessionsData.map(session => ({
        ...session,
        coach: profiles?.find(p => p.id === session.coach_id)
      }));

      setSessions(sessionsWithCoach);
    }
    
    // Fetch booking requests
    const { data: requestsData } = await supabase
      .from("booking_requests")
      .select("*")
      .eq("client_id", user?.id)
      .order("created_at", { ascending: false });
    
    if (requestsData) {
      setRequests(requestsData);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "completed": return "default";
      case "pending":
      case "upcoming": return "secondary";
      case "rejected":
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const upcomingSessions = sessions.filter(s => new Date(s.session_date) >= new Date());
  const pastSessions = sessions.filter(s => new Date(s.session_date) < new Date());

  return (
    <div className="client-portal page--with-nav">
      {/* Header */}
      <header className="client-portal__header">
        <div className="client-portal__header-inner">
          <div className="client-portal__brand">
            <img src={logo} alt="Vool" className="client-portal__logo-img" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="client-portal__main">
        <section className="client-portal__section">
          <h1 className="page-title">My Sessions</h1>
          <p className="page-subtitle">View your scheduled sessions and booking requests</p>
        </section>

        <section className="client-portal__section">
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              {loading ? (
                <div className="loading-state">Loading...</div>
              ) : upcomingSessions.length === 0 ? (
                <div className="empty-state">
                  <Calendar className="empty-state__icon" />
                  <p>No upcoming sessions</p>
                  <p className="empty-state__hint">Book a coach to get started</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {upcomingSessions.map((session) => (
                    <Card key={session.id} className="session-card">
                      <CardContent className="session-card__content">
                        <div className="session-card__header">
                          <Badge variant={getStatusColor(session.status)}>
                            {session.session_type}
                          </Badge>
                          {session.coach && (
                            <span className="session-card__coach">
                              with {session.coach.first_name} {session.coach.last_name}
                            </span>
                          )}
                        </div>
                        <div className="session-card__details">
                          <div className="session-card__detail">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(session.session_date), "EEE, MMM d, yyyy")}</span>
                          </div>
                          <div className="session-card__detail">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(session.session_date), "h:mm a")} ({session.duration} min)</span>
                          </div>
                          {session.location && (
                            <div className="session-card__detail">
                              <MapPin className="h-4 w-4" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              {pastSessions.length === 0 ? (
                <div className="empty-state">
                  <Calendar className="empty-state__icon" />
                  <p>No past sessions</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {pastSessions.map((session) => (
                    <Card key={session.id} className="session-card session-card--past">
                      <CardContent className="session-card__content">
                        <div className="session-card__header">
                          <Badge variant="outline">{session.session_type}</Badge>
                          {session.coach && (
                            <span className="session-card__coach">
                              with {session.coach.first_name} {session.coach.last_name}
                            </span>
                          )}
                        </div>
                        <div className="session-card__details">
                          <div className="session-card__detail">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(session.session_date), "EEE, MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="mt-4">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <Calendar className="empty-state__icon" />
                  <p>No booking requests</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {requests.map((request) => (
                    <Card key={request.id} className="session-request-card">
                      <CardContent className="session-request-card__content">
                        <div className="session-request-card__header">
                          <Badge variant={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                          <span className="session-request-card__date">
                            {format(new Date(request.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {request.message && (
                          <p className="session-request-card__message">{request.message}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>

      <ClientMobileNav />
    </div>
  );
};

export default MySessions;
