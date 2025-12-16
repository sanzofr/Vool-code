import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Clock, Award, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  is_available: boolean;
}

const FindCoaches = () => {
  const navigate = useNavigate();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    setLoading(true);
    
    try {
      // Get all coach user_ids from roles table
      const { data: coachRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "coach");
      
      if (rolesError) {
        console.error("Error fetching coach roles:", rolesError);
        setLoading(false);
        return;
      }
      
      if (coachRoles && coachRoles.length > 0) {
        const coachIds = coachRoles.map(r => r.user_id);
        
        // Fetch profiles for those coach IDs
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, bio, sport_specialty, experience_years, hourly_rate, is_available")
          .in("id", coachIds);
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          setLoading(false);
          return;
        }
        
        if (profiles) {
          // Filter for available coaches
          const availableCoaches = profiles.filter(p => p.is_available !== false);
          setCoaches(availableCoaches);
        }
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
    
    setLoading(false);
  };

  const filteredCoaches = coaches.filter(coach => {
    const searchLower = searchQuery.toLowerCase();
    return (
      coach.first_name.toLowerCase().includes(searchLower) ||
      coach.last_name.toLowerCase().includes(searchLower) ||
      (coach.sport_specialty?.toLowerCase().includes(searchLower))
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

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
          <h1 className="page-title">Find a Coach</h1>
          <p className="page-subtitle">Browse coaches and book your training sessions</p>
        </section>

        {/* Search */}
        <section className="client-portal__section">
          <div className="search-input-wrapper">
            <Search className="search-input-icon" />
            <Input
              placeholder="Search by name or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </section>

        {/* Coach List */}
        <section className="client-portal__section">
          {loading ? (
            <div className="loading-state">Loading coaches...</div>
          ) : filteredCoaches.length === 0 ? (
            <div className="empty-state">
              <p>No coaches found</p>
            </div>
          ) : (
            <div className="coach-list">
              {filteredCoaches.map((coach) => (
                <Card 
                  key={coach.id} 
                  className="coach-card"
                  onClick={() => navigate(`/coach/${coach.id}`)}
                >
                  <CardContent className="coach-card__content">
                    <div className="coach-card__avatar">
                      {coach.avatar_url ? (
                        <img src={coach.avatar_url} alt={coach.first_name} />
                      ) : (
                        <span>{getInitials(coach.first_name, coach.last_name)}</span>
                      )}
                    </div>
                    <div className="coach-card__info">
                      <h3 className="coach-card__name">
                        {coach.first_name} {coach.last_name}
                      </h3>
                      {coach.sport_specialty && (
                        <Badge variant="secondary" className="coach-card__sport">
                          {coach.sport_specialty}
                        </Badge>
                      )}
                      <div className="coach-card__meta">
                        {coach.experience_years && (
                          <span className="coach-card__meta-item">
                            <Award className="icon--xs" />
                            {coach.experience_years}+ years
                          </span>
                        )}
                        {coach.hourly_rate && (
                          <span className="coach-card__meta-item">
                            <Clock className="icon--xs" />
                            ${coach.hourly_rate}/hr
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="coach-card__arrow" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <ClientMobileNav />
    </div>
  );
};

export default FindCoaches;
