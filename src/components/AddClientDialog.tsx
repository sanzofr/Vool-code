import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
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
});

interface AddClientDialogProps {
  onClientAdded: () => void;
}

const AddClientDialog = ({ onClientAdded }: AddClientDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      clientSchema.parse(formData);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("clients").insert({
        coach_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone_number: formData.phoneNumber || null,
        sport: formData.sport,
        level: formData.level,
        health_info: formData.healthInfo || null,
        sessions_remaining: formData.sessionsRemaining,
      });

      if (error) throw error;

      toast({
        title: "Client added!",
        description: `${formData.firstName} ${formData.lastName} has been added.`,
      });

      setOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        sport: "",
        level: "",
        healthInfo: "",
        sessionsRemaining: 0,
      });
      onClientAdded();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon">
          <Plus className="icon--sm" />
        </Button>
      </DialogTrigger>
      <DialogContent style={{ maxWidth: '42rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="dialog-form__field">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="dialog-form__row">
            <div className="dialog-form__field">
              <Label htmlFor="sport">Sport *</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger id="sport">
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
              <Label htmlFor="level">Level *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger id="level">
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

          <div className="dialog-form__field">
            <Label htmlFor="sessionsRemaining">Sessions Remaining</Label>
            <Input
              id="sessionsRemaining"
              type="number"
              min="0"
              value={formData.sessionsRemaining}
              onChange={(e) =>
                setFormData({ ...formData, sessionsRemaining: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <div className="dialog-form__field">
            <Label htmlFor="healthInfo">Health Information (Optional)</Label>
            <Textarea
              id="healthInfo"
              value={formData.healthInfo}
              onChange={(e) => setFormData({ ...formData, healthInfo: e.target.value })}
              placeholder="Any injuries, conditions, or medical info to be aware of..."
              rows={3}
            />
          </div>

          <div className="dialog-form__actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
