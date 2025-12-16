import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Activity, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientMobileNav from "@/components/ClientMobileNav";
import ClientFeed from "@/components/ClientFeed";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import logo from "@/assets/logo.jpg";
import "@/styles/app.css";

interface BookingRequest {
  id: string;
  status: string;
  coach_id: string;
  package_id: string | null;
  coach_profile?: {
    first_name: string;
    last_name: string;
  };
  package?: {
    name: string;
    session_count: number;
  };
}

const ClientDashboard = () => {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string; avatar_url: string | null } | null>(null);
  const [nextSession, setNextSession] = useState<{ session_date: string; session_type: string } | null>(null);
  const [pendingBookings, setPendingBookings] = useState<BookingRequest[]>([]);
  const [acceptedBookings, setAcceptedBookings] = useState<BookingRequest[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchNextSession();
      fetchBookings();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", user?.id)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const fetchNextSession = async () => {
    const { data } = await supabase
      .from("sessions")
      .select("session_date, session_type")
      .eq("user_client_id", user?.id)
      .gte("session_date", new Date().toISOString())
      .order("session_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setNextSession(data);
    }
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("booking_requests")
      .select("id, status, coach_id, package_id")
      .eq("client_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Enrich with coach and package info
      const enriched = await Promise.all(
        data.map(async (booking) => {
          const { data: coachProfile } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", booking.coach_id)
            .maybeSingle();

          let pkg = null;
          if (booking.package_id) {
            const { data: pkgData } = await supabase
              .from("coach_packages")
              .select("name, session_count")
              .eq("id", booking.package_id)
              .maybeSingle();
            pkg = pkgData;
          }

          return { ...booking, coach_profile: coachProfile, package: pkg };
        })
      );

      setPendingBookings(enriched.filter(b => b.status === "pending"));
      setAcceptedBookings(enriched.filter(b => b.status === "accepted"));
    }
  };

  const getInitials = () => {
    if (profile) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();
    }
    return "?";
  };

  const menuItems = [
    {
      icon: Users,
      title: "Find Coaches",
      description: "Browse & book coaches",
      color: "bg-primary/10 text-primary",
      path: "/find-coaches",
    },
    {
      icon: Calendar,
      title: "My Sessions",
      description: "Upcoming & past sessions",
      color: "bg-secondary/10 text-secondary",
      path: "/my-sessions",
    },
    {
      icon: Activity,
      title: "Progress",
      description: "Track your improvement",
      color: "bg-success/10 text-success",
      path: "/client-dashboard",
    },
  ];

  return (
    <div className="client-portal page--with-nav">
      {/* Header */}
      <header className="client-portal__header">
        <div className="client-portal__header-inner">
          <div className="client-portal__brand">
            <img src={logo} alt="Vool" className="client-portal__logo-img" />
          </div>
          <NotificationsDropdown />
        </div>
      </header>

      {/* Main Content */}
      <main className="client-portal__main">
        {/* Welcome Section */}
        <section className="client-portal__welcome">
          <div className="client-portal__avatar">
            {getInitials()}
          </div>
          <div className="client-portal__greeting">
            <h1 className="client-portal__title">
              {profile ? `Hi, ${profile.first_name}` : "Welcome"}
            </h1>
            <p className="client-portal__subtitle">
              Ready to train today?
            </p>
          </div>
        </section>

        {/* Next Session Card */}
        <section className="client-portal__section">
          <Card className="client-portal__session-card">
            <CardContent className="client-portal__session-content">
              <div className="client-portal__session-icon">
                <Clock className="h-6 w-6" />
              </div>
              <div className="client-portal__session-info">
                <span className="client-portal__session-label">Next Session</span>
                <span className="client-portal__session-text">
                  {nextSession 
                    ? `${nextSession.session_type} - ${new Date(nextSession.session_date).toLocaleDateString()}`
                    : "No sessions scheduled"
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">Pending Requests</h2>
            <div className="space-y-2">
              {pendingBookings.map((booking) => (
                <Card key={booking.id} className="pending-booking-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="pending-booking__icon">
                      <AlertCircle className="h-5 w-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {booking.coach_profile?.first_name} {booking.coach_profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.package?.name || "Hourly booking"} • Awaiting response
                      </p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Active Packages */}
        {acceptedBookings.length > 0 && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">My Coaches</h2>
            <div className="space-y-2">
              {acceptedBookings.map((booking) => (
                <Card key={booking.id} className="active-booking-card">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="active-booking__icon">
                      <Users className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {booking.coach_profile?.first_name} {booking.coach_profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.package ? `${booking.package.name} - ${booking.package.session_count} sessions` : "Active"}
                      </p>
                    </div>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Quick Menu */}
        <section className="client-portal__section">
          <h2 className="client-portal__section-title">Quick Access</h2>
          <div className="client-portal__menu-grid">
            {menuItems.map((item) => (
              <Card 
                key={item.title} 
                className="client-portal__menu-card"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="client-portal__menu-content">
                  <div className={`client-portal__menu-icon ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="client-portal__menu-title">{item.title}</span>
                  <span className="client-portal__menu-desc">{item.description}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Feed Section */}
        <section className="client-portal__section">
          <ClientFeed />
        </section>
      </main>

      <ClientMobileNav />
    </div>
  );
};

export default ClientDashboard;
