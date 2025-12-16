import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  type: "manual" | "registered";
}

interface AddSessionDialogProps {
  onSessionAdded: () => void;
  selectedDate?: Date;
}

const AddSessionDialog = ({ onSessionAdded, selectedDate }: AddSessionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    session_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    session_time: "09:00",
    duration: "60",
    session_type: "Training",
    location: "",
  });

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        session_date: format(selectedDate, "yyyy-MM-dd")
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch manually added clients
      const { data: manualClients } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("coach_id", user.id)
        .order("first_name");

      // Fetch registered clients connected to this coach
      const { data: relationships } = await supabase
        .from("coach_client_relationships")
        .select("client_id")
        .eq("coach_id", user.id);

      let registeredClients: Client[] = [];
      if (relationships && relationships.length > 0) {
        const clientIds = relationships.map(r => r.client_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", clientIds);

        if (profiles) {
          registeredClients = profiles.map(p => ({
            id: `registered_${p.id}`,
            first_name: p.first_name,
            last_name: p.last_name,
            type: "registered" as const
          }));
        }
      }

      const allClients = [
        ...(manualClients || []).map(c => ({ ...c, type: "manual" as const })),
        ...registeredClients
      ];

      setClients(allClients);
    };

    if (open) fetchClients();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sessionDateTime = new Date(`${formData.session_date}T${formData.session_time}`);
      const selectedClient = clients.find(c => c.id === formData.client_id);
      
      const isRegistered = formData.client_id.startsWith("registered_");
      const actualClientId = isRegistered ? null : formData.client_id;
      const userClientId = isRegistered ? formData.client_id.replace("registered_", "") : null;

      const { error } = await supabase.from("sessions").insert({
        coach_id: user.id,
        client_id: actualClientId,
        user_client_id: userClientId,
        session_date: sessionDateTime.toISOString(),
        duration: parseInt(formData.duration),
        session_type: formData.session_type,
        location: formData.location || null,
        status: "upcoming",
      });

      if (error) throw error;

      toast({
        title: "Session scheduled",
        description: "The session has been added to your calendar.",
      });

      setOpen(false);
      onSessionAdded();
      setFormData({
        client_id: "",
        session_date: format(new Date(), "yyyy-MM-dd"),
        session_time: "09:00",
        duration: "60",
        session_type: "Training",
        location: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="icon--sm" style={{ marginRight: '0.5rem' }} />
          Add Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule New Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-form__field">
            <Label htmlFor="client">Client *</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                    {client.type === "registered" && " ✓"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="duration">Duration (mins)</Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="type">Session Type</Label>
              <Select
                value={formData.session_type}
                onValueChange={(value) => setFormData({ ...formData, session_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Recovery">Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="dialog-form__field">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Tennis Court 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="dialog-form__actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.client_id}>
              {isSubmitting ? "Scheduling..." : "Schedule Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSessionDialog;
