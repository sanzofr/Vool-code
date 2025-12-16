import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import "@/styles/app.css";

interface BookingRequest {
  id: string;
  client_id: string;
  package_id: string | null;
  message: string | null;
  status: string;
  requested_sessions: number | null;
  created_at: string;
  client_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
  package: {
    name: string;
    price: number;
    session_count: number;
  } | null;
}

const BookingManagement = () => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookingRequests();
    }
  }, [user]);

  const fetchBookingRequests = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("booking_requests")
      .select(`
        id,
        client_id,
        package_id,
        message,
        status,
        requested_sessions,
        created_at
      `)
      .eq("coach_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch client profiles and packages separately
      const enrichedRequests = await Promise.all(
        data.map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url")
            .eq("id", request.client_id)
            .maybeSingle();

          let pkg = null;
          if (request.package_id) {
            const { data: packageData } = await supabase
              .from("coach_packages")
              .select("name, price, session_count")
              .eq("id", request.package_id)
              .maybeSingle();
            pkg = packageData;
          }

          return {
            ...request,
            client_profile: profile,
            package: pkg
          };
        })
      );
      setRequests(enrichedRequests);
    }
    
    setLoading(false);
  };

  const handleAccept = async (request: BookingRequest) => {
    try {
      // Update booking request status
      await supabase
        .from("booking_requests")
        .update({ status: "accepted" })
        .eq("id", request.id);

      // Update coach-client relationship to active
      await supabase
        .from("coach_client_relationships")
        .upsert({
          coach_id: user?.id,
          client_id: request.client_id,
          status: "active"
        }, { onConflict: "coach_id,client_id" });

      // Get coach info for notification
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user?.id)
        .single();

      // Send notification to client
      await createNotification(
        request.client_id,
        "booking_accepted",
        "Booking Accepted!",
        `${coachProfile?.first_name} ${coachProfile?.last_name} has accepted your booking request. You can now start training!`,
        { coach_id: user?.id }
      );

      toast({
        title: "Booking Accepted",
        description: `You've accepted ${request.client_profile?.first_name}'s booking request.`
      });

      fetchBookingRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReject = async (request: BookingRequest) => {
    try {
      await supabase
        .from("booking_requests")
        .update({ status: "rejected" })
        .eq("id", request.id);

      // Get coach info for notification
      const { data: coachProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user?.id)
        .single();

      // Send notification to client
      await createNotification(
        request.client_id,
        "booking_rejected",
        "Booking Update",
        `${coachProfile?.first_name} ${coachProfile?.last_name} was unable to accept your booking request at this time.`,
        { coach_id: user?.id }
      );

      toast({
        title: "Booking Rejected",
        description: "The booking request has been declined."
      });

      fetchBookingRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const processedRequests = requests.filter(r => r.status !== "pending");

  return (
    <div className="page page--with-nav">
      <Header />

      <main className="container section">
        <div className="page-header">
          <h1 className="page-title">Booking Requests</h1>
          <p className="page-subtitle">Manage client booking requests</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading requests...</div>
        ) : (
          <>
            {/* Pending Requests */}
            <section className="mb-8">
              <h2 className="section-title">Pending ({pendingRequests.length})</h2>
              {pendingRequests.length === 0 ? (
                <Card className="empty-state">
                  <p>No pending requests</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id} className="booking-request-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="booking-request__avatar">
                            {request.client_profile?.avatar_url ? (
                              <img src={request.client_profile.avatar_url} alt="" />
                            ) : (
                              <span>
                                {request.client_profile 
                                  ? getInitials(request.client_profile.first_name, request.client_profile.last_name)
                                  : <User className="h-5 w-5" />
                                }
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">
                              {request.client_profile?.first_name} {request.client_profile?.last_name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {request.package ? (
                                <Badge variant="secondary">
                                  <Package className="h-3 w-3 mr-1" />
                                  {request.package.name} - ${request.package.price}
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {request.requested_sessions || 1} hour(s)
                                </Badge>
                              )}
                            </div>
                            {request.message && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                "{request.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            className="flex-1" 
                            onClick={() => handleAccept(request)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleReject(request)}
                          >
                            <X className="h-4 w-4 mr-1" /> Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <section>
                <h2 className="section-title">History</h2>
                <div className="space-y-3">
                  {processedRequests.map((request) => (
                    <Card key={request.id} className="booking-request-card booking-request-card--processed">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="booking-request__avatar booking-request__avatar--small">
                            {request.client_profile?.avatar_url ? (
                              <img src={request.client_profile.avatar_url} alt="" />
                            ) : (
                              <span>
                                {request.client_profile 
                                  ? getInitials(request.client_profile.first_name, request.client_profile.last_name)
                                  : <User className="h-4 w-4" />
                                }
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {request.client_profile?.first_name} {request.client_profile?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant={request.status === "accepted" ? "default" : "secondary"}
                            className={request.status === "accepted" ? "bg-success" : ""}
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default BookingManagement;