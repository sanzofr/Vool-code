import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface FeedMessage {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const CoachFeed = () => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("feed_messages")
      .select("*")
      .eq("coach_id", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from("feed_messages")
      .insert({
        coach_id: user?.id,
        title: formData.title,
        content: formData.content
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Sent!",
        description: "Message sent to all your clients"
      });
      setFormData({ title: "", content: "" });
      setIsDialogOpen(false);
      fetchMessages();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("feed_messages")
      .delete()
      .eq("id", id);

    if (!error) {
      toast({ title: "Deleted", description: "Message removed" });
      fetchMessages();
    }
  };

  return (
    <div className="feed">
      <div className="feed__header">
        <h2 className="client-portal__section-title">Announcements</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Send className="h-4 w-4 mr-1" /> Broadcast
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send to All Clients</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Title</label>
                <Input
                  placeholder="e.g. Schedule Update"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <Textarea
                  placeholder="Write your message..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                />
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Sending..." : "Send to All Clients"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="loading-state">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="empty-state">
          <MessageSquare className="empty-state__icon" />
          <p>No announcements yet</p>
          <p className="empty-state__hint">Broadcast messages to your clients</p>
        </div>
      ) : (
        <div className="feed__list">
          {messages.map((msg) => (
            <Card key={msg.id} className="feed__card">
              <CardContent className="feed__card-content">
                <div className="feed__card-header">
                  <h3 className="feed__card-title">{msg.title}</h3>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(msg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="feed__card-text">{msg.content}</p>
                <span className="feed__card-date">
                  {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachFeed;
