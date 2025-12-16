import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

interface Session {
  id: string;
  session_date: string;
  duration: number;
  session_type: string;
  location: string | null;
  client_id: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
}

interface EditSessionDialogProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated: () => void;
}

const EditSessionDialog = ({ session, open, onOpenChange, onSessionUpdated }: EditSessionDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    client_id: "",
    session_date: "",
    session_time: "09:00",
    duration: "60",
    session_type: "Training",
    location: "",
  });

  useEffect(() => {
    if (session) {
      const sessionDate = parseISO(session.session_date);
      setFormData({
        client_id: session.client_id,
        session_date: format(sessionDate, "yyyy-MM-dd"),
        session_time: format(sessionDate, "HH:mm"),
        duration: session.duration.toString(),
        session_type: session.session_type,
        location: session.location || "",
      });
    }
  }, [session]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
        .eq("coach_id", user.id)
        .order("first_name");

      if (data) setClients(data);
    };

    if (open) fetchClients();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsSubmitting(true);

    try {
      const sessionDateTime = new Date(`${formData.session_date}T${formData.session_time}`);

      const { error } = await supabase
        .from("sessions")
        .update({
          client_id: formData.client_id,
          session_date: sessionDateTime.toISOString(),
          duration: parseInt(formData.duration),
          session_type: formData.session_type,
          location: formData.location || null,
        })
        .eq("id", session.id);

      if (error) throw error;

      toast({
        title: "Session updated",
        description: "The session has been updated.",
      });

      onOpenChange(false);
      onSessionUpdated();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-form__field">
            <Label htmlFor="edit-client">Client *</Label>
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
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                required
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="edit-time">Time *</Label>
              <Input
                id="edit-time"
                type="time"
                value={formData.session_time}
                onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-duration">Duration (mins)</Label>
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
              <Label htmlFor="edit-type">Session Type</Label>
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
            <Label htmlFor="edit-location">Location</Label>
            <Input
              id="edit-location"
              placeholder="e.g., Tennis Court 1"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="dialog-form__actions">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.client_id}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionDialog;
