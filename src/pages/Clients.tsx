import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientCard from "@/components/ClientCard";
import AddClientDialog from "@/components/AddClientDialog";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  sport: string;
  level: string;
  payment_status: "paid" | "pending" | "overdue";
  sessions_remaining: number;
  next_session?: {
    session_date: string;
  };
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState<string>("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch clients with their next upcoming session
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch next session for each client
      const clientsWithSessions = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { data: sessionData } = await supabase
            .from("sessions")
            .select("session_date")
            .eq("client_id", client.id)
            .eq("coach_id", user.id)
            .gte("session_date", new Date().toISOString())
            .order("session_date", { ascending: true })
            .limit(1)
            .single();

          return {
            ...client,
            next_session: sessionData || undefined,
          };
        })
      );

      setClients(clientsWithSessions as Client[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = !sportFilter || sportFilter === "all" || client.sport === sportFilter;
    const matchesLevel = !levelFilter || levelFilter === "all" || client.level === levelFilter;
    return matchesSearch && matchesSport && matchesLevel;
  });

  const activeFiltersCount = (sportFilter && sportFilter !== "all" ? 1 : 0) + (levelFilter && levelFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSportFilter("");
    setLevelFilter("");
  };

  const formatNextSession = (date: string | undefined) => {
    if (!date) return undefined;
    const sessionDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (sessionDate >= today && sessionDate < tomorrow) {
      return `Today, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (sessionDate >= tomorrow && sessionDate < new Date(tomorrow.getTime() + 86400000)) {
      return `Tomorrow, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return sessionDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        `, ${sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__content">
          <div className="loading__spinner"></div>
          <p className="loading__text">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section space-y-6">
        <div className="clients-page__header">
          <h2 className="clients-page__title">Clients</h2>
          <p className="clients-page__count">{filteredClients.length} active clients</p>
        </div>

        <div className="clients-page__search">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <Input 
              placeholder="Search clients..." 
              className="with-icon"
              style={{ paddingLeft: '2.25rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={activeFiltersCount > 0 ? "filter-btn--active" : ""}>
                <Filter className="icon--sm" />
                {activeFiltersCount > 0 && (
                  <span className="filter-badge">{activeFiltersCount}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="filter-popover">
              <div className="filter-popover__header">
                <h4 className="filter-popover__title">Filters</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
              <div className="filter-popover__content">
                <div className="filter-popover__field">
                  <label className="filter-popover__label">Sport</label>
                  <Select value={sportFilter} onValueChange={setSportFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All sports" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sports</SelectItem>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Boxing">Boxing</SelectItem>
                      <SelectItem value="Swimming">Swimming</SelectItem>
                      <SelectItem value="Padel">Padel</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                      <SelectItem value="Golf">Golf</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="filter-popover__field">
                  <label className="filter-popover__label">Level</label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <AddClientDialog onClientAdded={fetchClients} />
        </div>

        {activeFiltersCount > 0 && (
          <div className="clients-page__active-filters">
            {sportFilter && sportFilter !== "all" && (
              <Badge variant="secondary" className="filter-tag">
                {sportFilter}
                <button onClick={() => setSportFilter("")} className="filter-tag__remove">
                  <X className="icon--xs" />
                </button>
              </Badge>
            )}
            {levelFilter && levelFilter !== "all" && (
              <Badge variant="secondary" className="filter-tag">
                {levelFilter}
                <button onClick={() => setLevelFilter("")} className="filter-tag__remove">
                  <X className="icon--xs" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {filteredClients.length === 0 ? (
          <div className="clients-page__empty">
            <p className="clients-page__empty-text">No clients yet. Add your first client!</p>
            <AddClientDialog onClientAdded={fetchClients} />
          </div>
        ) : (
          <div className="clients-page__list">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id}
                name={`${client.first_name} ${client.last_name}`}
                sport={client.sport}
                level={client.level}
                nextSession={formatNextSession(client.next_session?.session_date)}
                paymentStatus={client.payment_status}
                sessionsRemaining={client.sessions_remaining}
              />
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
};

export default Clients;
