import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const clientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phoneNumber: z.string().trim().max(20).optional(),
  sport: z.string().min(1, "Sport is required"),
  level: z.string().min(1, "Level is required"),
  healthInfo: z.string().max(1000).optional(),
  sessionsRemaining: z.number().min(0).optional(),
  paymentStatus: z.string().optional(),
});

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  sport: string;
  level: string;
  health_info: string | null;
  sessions_remaining: number;
  payment_status: string;
}

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientUpdated: () => void;
}

const EditClientDialog = ({ client, open, onOpenChange, onClientUpdated }: EditClientDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    sport: "",
    level: "",
    healthInfo: "",
    sessionsRemaining: 0,
    paymentStatus: "pending",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email || "",
        phoneNumber: client.phone_number || "",
        sport: client.sport,
        level: client.level,
        healthInfo: client.health_info || "",
        sessionsRemaining: client.sessions_remaining || 0,
        paymentStatus: client.payment_status || "pending",
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setLoading(true);

    try {
      clientSchema.parse(formData);

      const { error } = await supabase
        .from("clients")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone_number: formData.phoneNumber || null,
          sport: formData.sport,
          level: formData.level,
          health_info: formData.healthInfo || null,
          sessions_remaining: formData.sessionsRemaining,
          payment_status: formData.paymentStatus,
        })
        .eq("id", client.id);

      if (error) throw error;

      toast({
        title: "Client updated!",
        description: `${formData.firstName} ${formData.lastName} has been updated.`,
      });

      onOpenChange(false);
      onClientUpdated();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="edit-lastName">Last Name *</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="edit-phoneNumber">Phone Number</Label>
              <Input
                id="edit-phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-sport">Sport *</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger id="edit-sport">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
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
            <div className="dialog-form__field">
              <Label htmlFor="edit-level">Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger id="edit-level">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="edit-sessionsRemaining">Sessions Remaining</Label>
              <Input
                id="edit-sessionsRemaining"
                type="number"
                min="0"
                value={formData.sessionsRemaining}
                onChange={(e) =>
                  setFormData({ ...formData, sessionsRemaining: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="edit-paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value })}
              >
                <SelectTrigger id="edit-paymentStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="dialog-form__field">
            <Label htmlFor="edit-healthInfo">Health Information (Optional)</Label>
            <Textarea
              id="edit-healthInfo"
              value={formData.healthInfo}
              onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
              placeholder="Any injuries, conditions, or medical info to be aware of..."
              rows={3}
            />
          </div>

          <div className="dialog-form__actions">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientDialog;
