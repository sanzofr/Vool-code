import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Award, Clock, CheckCircle, Package, MessageCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotifications";
import ClientMobileNav from "@/components/ClientMobileNav";
import logo from "@/assets/logo.jpg";
import "@/styles/app.css";

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  sport_specialty: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  certifications: string[] | null;
  whatsapp: string | null;
  telegram: string | null;
  phone_number: string | null;
}

interface CoachPackage {
  id: string;
  name: string;
  description: string | null;
  session_count: number;
  price: number;
  discount_percentage: number;
}

const CoachProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUserRole();
  const { toast } = useToast();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CoachPackage | null>(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [requestedHours, setRequestedHours] = useState(1);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isHourlyOpen, setIsHourlyOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCoachDetails();
    }
  }, [id]);

  const fetchCoachDetails = async () => {
    setLoading(true);
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, bio, sport_specialty, experience_years, hourly_rate, certifications, whatsapp, telegram, phone_number")
      .eq("id", id)
      .maybeSingle();
    
    if (profile) {
      setCoach(profile);
    }
    
    const { data: coachPackages } = await supabase
      .from("coach_packages")
      .select("*")
      .eq("coach_id", id)
      .eq("is_active", true);
    
    if (coachPackages) {
      setPackages(coachPackages);
    }
    
    setLoading(false);
  };

  const handleBookingRequest = async (isHourly: boolean = false) => {
    if (!user || !coach) return;
    
    setSubmitting(true);

    try {
      // Get client profile
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      
      // Create coach-client relationship if it doesn't exist
      await supabase
        .from("coach_client_relationships")
        .upsert({
          coach_id: coach.id,
          client_id: user.id,
          status: "pending"
        }, { onConflict: "coach_id,client_id" });
      
      const message = isHourly 
        ? `Requesting ${requestedHours} hour(s) at $${coach.hourly_rate}/hr. ${bookingMessage}`
        : bookingMessage;

      const { data: bookingData, error } = await supabase
        .from("booking_requests")
        .insert({
          client_id: user.id,
          coach_id: coach.id,
          package_id: selectedPackage?.id || null,
          message,
          status: "pending"
        })
        .select()
        .single();
      
      if (error) throw error;

      // Send notification to coach with booking_request_id
      await createNotification(
        coach.id,
        "booking_request",
        "New Booking Request",
        `${clientProfile?.first_name} ${clientProfile?.last_name} wants to book ${isHourly ? `${requestedHours} hour(s)` : selectedPackage?.name || 'a session'}`,
        { client_id: user.id, package_id: selectedPackage?.id, booking_request_id: bookingData.id }
      );

      toast({
        title: "Request Sent!",
        description: "Your booking request has been sent to the coach."
      });
      setIsBookingOpen(false);
      setIsHourlyOpen(false);
      setBookingMessage("");
      setSelectedPackage(null);
      setRequestedHours(1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send booking request. Please try again.",
        variant: "destructive"
      });
    }
    
    setSubmitting(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="client-portal">
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="client-portal">
        <div className="empty-state">Coach not found</div>
      </div>
    );
  }

  return (
    <div className="client-portal page--with-nav">
      {/* Header */}
      <header className="client-portal__header">
        <div className="client-portal__header-inner">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="client-portal__brand">
            <img src={logo} alt="Vool" className="client-portal__logo-img" />
          </div>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* Main Content */}
      <main className="client-portal__main">
        {/* Coach Header */}
        <section className="coach-profile__header">
          <div className="coach-profile__avatar">
            {coach.avatar_url ? (
              <img src={coach.avatar_url} alt={coach.first_name} />
            ) : (
              <span>{getInitials(coach.first_name, coach.last_name)}</span>
            )}
          </div>
          <h1 className="coach-profile__name">
            {coach.first_name} {coach.last_name}
          </h1>
          {coach.sport_specialty && (
            <Badge variant="secondary" className="coach-profile__sport">
              {coach.sport_specialty}
            </Badge>
          )}
          <div className="coach-profile__stats">
            {coach.experience_years && (
              <div className="coach-profile__stat">
                <Award className="h-4 w-4" />
                <span>{coach.experience_years}+ years</span>
              </div>
            )}
            {coach.hourly_rate && (
              <div className="coach-profile__stat">
                <Clock className="h-4 w-4" />
                <span>${coach.hourly_rate}/hr</span>
              </div>
            )}
          </div>
        </section>

        {/* Contact Info */}
        {(coach.whatsapp || coach.telegram || coach.phone_number) && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">Contact</h2>
            <div className="flex flex-wrap gap-2">
              {coach.phone_number && (
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${coach.phone_number}`)}>
                  <Phone className="h-4 w-4 mr-1" /> Call
                </Button>
              )}
              {coach.whatsapp && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/${coach.whatsapp.replace(/\D/g, '')}`)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              )}
              {coach.telegram && (
                <Button variant="outline" size="sm" onClick={() => window.open(`https://t.me/${coach.telegram.replace('@', '')}`)}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Telegram
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Bio */}
        {coach.bio && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">About</h2>
            <Card>
              <CardContent className="p-4">
                <p className="coach-profile__bio">{coach.bio}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Certifications */}
        {coach.certifications && coach.certifications.length > 0 && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">Certifications</h2>
            <div className="coach-profile__certs">
              {coach.certifications.map((cert, index) => (
                <div key={index} className="coach-profile__cert">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hourly Booking */}
        {coach.hourly_rate && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">Hourly Rate</h2>
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setIsHourlyOpen(true)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">${coach.hourly_rate}/hour</p>
                  <p className="text-sm text-muted-foreground">Book hours directly</p>
                </div>
                <Button size="sm">Request Hours</Button>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Packages */}
        {packages.length > 0 && (
          <section className="client-portal__section">
            <h2 className="client-portal__section-title">Training Packages</h2>
            <div className="packages-list">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id} 
                  className={`package-card ${selectedPackage?.id === pkg.id ? 'package-card--selected' : ''}`}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setIsBookingOpen(true);
                  }}
                >
                  <CardContent className="package-card__content">
                    <div className="package-card__header">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="package-card__name">{pkg.name}</h3>
                    </div>
                    <p className="package-card__sessions">{pkg.session_count} sessions</p>
                    {pkg.description && (
                      <p className="package-card__desc">{pkg.description}</p>
                    )}
                    <div className="package-card__price">
                      <span className="package-card__amount">${pkg.price}</span>
                      {pkg.discount_percentage > 0 && (
                        <Badge variant="secondary" className="package-card__discount">
                          {pkg.discount_percentage}% off
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Book Button */}
        <section className="client-portal__section">
          <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
            <DialogTrigger asChild>
              <Button className="w-full btn--primary" size="lg">
                Request Booking
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book with {coach.first_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedPackage && (
                  <div className="booking-selected-package">
                    <p className="text-sm text-muted-foreground">Selected Package:</p>
                    <p className="font-semibold">{selectedPackage.name} - ${selectedPackage.price}</p>
                  </div>
                )}
                <div>
                  <label className="form-label">Message to Coach</label>
                  <Textarea
                    placeholder="Introduce yourself and share your goals..."
                    value={bookingMessage}
                    onChange={(e) => setBookingMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button 
                  className="w-full btn--primary" 
                  onClick={() => handleBookingRequest(false)}
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Hourly Dialog */}
        <Dialog open={isHourlyOpen} onOpenChange={setIsHourlyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Hours</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="booking-selected-package">
                <p className="text-sm text-muted-foreground">Rate:</p>
                <p className="font-semibold">${coach.hourly_rate}/hour</p>
              </div>
              <div>
                <Label>Number of Hours</Label>
                <Input
                  type="number"
                  min={1}
                  value={requestedHours}
                  onChange={(e) => setRequestedHours(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Total: ${(coach.hourly_rate || 0) * requestedHours}
                </p>
              </div>
              <div>
                <Label>Message to Coach</Label>
                <Textarea
                  placeholder="Introduce yourself and share your goals..."
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                className="w-full btn--primary" 
                onClick={() => handleBookingRequest(true)}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <ClientMobileNav />
    </div>
  );
};

export default CoachProfilePage;
