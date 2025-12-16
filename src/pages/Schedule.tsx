import { useState, useEffect, useCallback } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, MoreVertical, Trash2, GripVertical, Pencil, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AddSessionDialog from "@/components/AddSessionDialog";
import EditSessionDialog from "@/components/EditSessionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from "date-fns";

interface Session {
  id: string;
  session_date: string;
  duration: number;
  session_type: string;
  location: string | null;
  status: string | null;
  client_id: string;
  client: {
    first_name: string;
    last_name: string;
  };
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

const Schedule = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedClient, setDraggedClient] = useState<Client | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<Date | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("sessions")
        .select(`
          id,
          session_date,
          duration,
          session_type,
          location,
          status,
          client_id,
          client:clients(first_name, last_name)
        `)
        .eq("coach_id", user.id)
        .gte("session_date", start.toISOString())
        .lte("session_date", end.toISOString())
        .order("session_date", { ascending: true });

      if (error) throw error;
      setSessions(data as unknown as Session[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch manually added clients
      const { data: manualClients, error: manualError } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("coach_id", user.id)
        .order("first_name");

      if (manualError) throw manualError;

      // Also fetch registered platform clients via relationships
      const { data: relationships } = await supabase
        .from("coach_client_relationships")
        .select("client_id")
        .eq("coach_id", user.id)
        .eq("status", "active");

      let registeredClients: Client[] = [];
      if (relationships && relationships.length > 0) {
        const clientIds = relationships.map(r => r.client_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", clientIds);
        
        if (profiles) {
          registeredClients = profiles.map(p => ({
            id: p.id,
            first_name: p.first_name + " ✓",
            last_name: p.last_name
          }));
        }
      }

      // Combine both lists
      setClients([...(manualClients || []), ...registeredClients]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchClients();
  }, [currentMonth]);

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
      if (error) throw error;
      
      toast({
        title: "Session deleted",
        description: "The session has been removed from your calendar.",
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markSessionComplete = async (session: Session) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", session.id);

      if (error) throw error;

      // Get the client to decrement sessions (trigger handles this)
      // Also create notification for session completion
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: coachProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        // Notify the client if they have a user account
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("user_client_id")
          .eq("id", session.id)
          .single();

        if (sessionData?.user_client_id) {
          await createNotification(
            sessionData.user_client_id,
            "session_completed",
            "Session Completed",
            `Your ${session.session_type} session with ${coachProfile?.first_name} ${coachProfile?.last_name} has been marked as complete.`,
            { session_id: session.id }
          );
        }
      }

      toast({
        title: "Session completed",
        description: `${session.client.first_name}'s session has been marked as complete.`,
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createQuickSession = async (clientId: string, date: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Set default time to 9:00 AM
      const sessionDate = new Date(date);
      sessionDate.setHours(9, 0, 0, 0);

      const { error } = await supabase.from("sessions").insert({
        coach_id: user.id,
        client_id: clientId,
        session_date: sessionDate.toISOString(),
        duration: 60,
        session_type: "Training",
        status: "upcoming",
      });

      if (error) throw error;

      toast({
        title: "Session scheduled",
        description: `Quick session added for ${format(date, 'MMM d')} at 9:00 AM`,
      });
      fetchSessions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (client: Client) => {
    setDraggedClient(client);
  };

  const handleDragEnd = () => {
    setDraggedClient(null);
    setDropTargetDate(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    setDropTargetDate(date);
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedClient) {
      createQuickSession(draggedClient.id, date);
    }
    setDraggedClient(null);
    setDropTargetDate(null);
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (client: Client) => {
    setDraggedClient(client);
  };

  const handleTouchEnd = () => {
    if (draggedClient && dropTargetDate) {
      createQuickSession(draggedClient.id, dropTargetDate);
    }
    setDraggedClient(null);
    setDropTargetDate(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayButton = element?.closest('[data-date]');
    if (dayButton) {
      const dateStr = dayButton.getAttribute('data-date');
      if (dateStr) {
        setDropTargetDate(new Date(dateStr));
      }
    }
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => 
      isSameDay(parseISO(session.session_date), date)
    );
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = day;
      const daySessions = getSessionsForDate(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, currentMonth);
      const isSelected = isSameDay(currentDay, selectedDate);
      const isToday = isSameDay(currentDay, new Date());
      const isDropTarget = dropTargetDate && isSameDay(currentDay, dropTargetDate);

      days.push(
        <button
          key={currentDay.toString()}
          data-date={currentDay.toISOString()}
          onClick={() => setSelectedDate(currentDay)}
          onDragOver={(e) => handleDragOver(e, currentDay)}
          onDrop={(e) => handleDrop(e, currentDay)}
          className={`calendar__day ${!isCurrentMonth ? 'calendar__day--outside' : ''} ${isSelected ? 'calendar__day--selected' : ''} ${isToday ? 'calendar__day--today' : ''} ${isDropTarget ? 'calendar__day--drop-target' : ''}`}
        >
          <span className="calendar__day-number">{format(currentDay, 'd')}</span>
          {daySessions.length > 0 && (
            <div className="calendar__day-dots">
              {daySessions.slice(0, 3).map((_, i) => (
                <span key={i} className="calendar__day-dot" />
              ))}
            </div>
          )}
        </button>
      );

      day = addDays(day, 1);
    }

    return days;
  };

  const selectedDateSessions = getSessionsForDate(selectedDate);

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section">
        <div className="schedule-header">
          <div>
            <h2 className="schedule-header__title">Schedule</h2>
            <p className="schedule-header__subtitle">Drag clients to calendar to schedule</p>
          </div>
          <AddSessionDialog onSessionAdded={fetchSessions} selectedDate={selectedDate} />
        </div>

        <div className="schedule-layout">
          {/* Calendar */}
          <Card className="calendar-card">
            <div className="calendar__header">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="icon" />
              </Button>
              <h3 className="calendar__month">{format(currentMonth, 'MMMM yyyy')}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="icon" />
              </Button>
            </div>

            <div className="calendar__weekdays">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="calendar__weekday">{day}</div>
              ))}
            </div>

            <div className="calendar__grid">
              {renderCalendarDays()}
            </div>

            {/* Draggable Clients */}
            <div className="calendar__clients">
              <h4 className="calendar__clients-title">Quick Schedule</h4>
              <p className="calendar__clients-hint">Drag a client to a date</p>
              <div className="calendar__clients-list">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    draggable
                    onDragStart={() => handleDragStart(client)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={() => handleTouchStart(client)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`draggable-client ${draggedClient?.id === client.id ? 'draggable-client--dragging' : ''}`}
                  >
                    <GripVertical className="draggable-client__grip" />
                    <span className="draggable-client__name">
                      {client.first_name} {client.last_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Day Sessions */}
          <div className="day-sessions">
            <h3 className="day-sessions__title">
              {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
            </h3>
            
            {isLoading ? (
              <Card className="empty-state">
                <p className="empty-state__text">Loading sessions...</p>
              </Card>
            ) : selectedDateSessions.length === 0 ? (
              <Card className="empty-state">
                <Calendar className="empty-state__icon" />
                <p className="empty-state__text">No sessions scheduled</p>
              </Card>
            ) : (
              <div className="sessions-list">
                {selectedDateSessions.map((session) => (
                  <Card key={session.id} className="session-card">
                    <div className="session-card__header">
                      <div className="session-card__time">
                        <Clock className="session-card__icon" />
                        <span>{format(parseISO(session.session_date), 'h:mm a')}</span>
                        <Badge variant="secondary">{session.duration} min</Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="more-button">
                            <MoreVertical className="icon--sm" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {session.status !== "completed" && (
                            <DropdownMenuItem onClick={() => markSessionComplete(session)}>
                              <CheckCircle className="icon--sm" style={{ marginRight: '0.5rem' }} />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditingSession(session);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="icon--sm" style={{ marginRight: '0.5rem' }} />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteSession(session.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="icon--sm" style={{ marginRight: '0.5rem' }} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="session-card__client">
                      <User className="session-card__icon" />
                      <span>{session.client.first_name} {session.client.last_name}</span>
                    </div>
                    
                    <div className="session-card__details">
                      <Badge>{session.session_type}</Badge>
                      {session.location && (
                        <span className="session-card__location">
                          <MapPin className="session-card__icon" />
                          {session.location}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav />

      <EditSessionDialog
        session={editingSession}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSessionUpdated={fetchSessions}
      />
    </div>
  );
};

export default Schedule;
