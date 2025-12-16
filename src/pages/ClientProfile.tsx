import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, Mail, Edit, Plus, Video, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileNav from "@/components/MobileNav";
import EditClientDialog from "@/components/EditClientDialog";
import ClientMediaUpload from "@/components/ClientMediaUpload";
import ClientMediaCard from "@/components/ClientMediaCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  created_at: string;
}

interface Note {
  id: string;
  content: string;
  note_type: string;
  created_at: string;
}

interface ClientMedia {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  media_type: string;
  coach_review: string | null;
  review_date: string | null;
  created_at: string;
}

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [media, setMedia] = useState<ClientMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const fetchClientData = async () => {
    try {
      // Fetch client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from("session_notes")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("client_tags")
        .select("tag")
        .eq("client_id", id);

      if (tagsError) throw tagsError;
      setTags(tagsData?.map(t => t.tag) || []);

      // Fetch media
      const { data: mediaData, error: mediaError } = await supabase
        .from("client_media")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      if (mediaError) throw mediaError;
      setMedia(mediaData || []);
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

  const addNote = async () => {
    if (!noteContent.trim() || !client) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("session_notes").insert({
        client_id: client.id,
        coach_id: user.id,
        session_id: null,
        content: noteContent,
        note_type: "general",
      });

      if (error) throw error;

      toast({
        title: "Note added",
        description: "Your note has been saved.",
      });

      setNoteContent("");
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !client) return;

    try {
      const { error } = await supabase.from("client_tags").insert({
        client_id: client.id,
        tag: newTag,
      });

      if (error) throw error;

      toast({
        title: "Tag added",
        description: `Added "${newTag}" tag.`,
      });

      setNewTag("");
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__content">
          <div className="loading__spinner"></div>
          <p className="loading__text">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="loading">
        <div className="loading__content">
          <h2 className="text-2xl font-bold mb-2">Client not found</h2>
          <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--with-nav">
      <header className="profile-header">
        <div className="container profile-header__inner">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="icon" />
          </Button>
          <h1 className="profile-header__title">Client Profile</h1>
        </div>
      </header>

      <main className="container section space-y-6">
        <Card className="profile-card">
          <div className="profile-card__header">
            <Avatar className="profile-card__avatar">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {getInitials(client.first_name, client.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="profile-card__info">
              <h2 className="profile-card__name">
                {client.first_name} {client.last_name}
              </h2>
              <p className="profile-card__details">{client.sport} • {client.level}</p>
              <div className="profile-card__badges">
                <Badge variant="outline">{client.sessions_remaining} sessions left</Badge>
                <Badge className="payment-badge--paid">
                  Payment {client.payment_status}
                </Badge>
              </div>
            </div>
            
            <Button variant="outline" size="icon" onClick={() => setEditDialogOpen(true)}>
              <Edit className="icon--sm" />
            </Button>
          </div>

          <div className="profile-card__actions">
            {client.phone_number && (
              <Button 
                variant="outline" 
                style={{ justifyContent: 'flex-start' }}
                onClick={() => window.location.href = `tel:${client.phone_number}`}
              >
                <Phone className="icon--sm" style={{ marginRight: '0.5rem' }} />
                Call
              </Button>
            )}
            {client.email && (
              <Button 
                variant="outline" 
                style={{ justifyContent: 'flex-start' }}
                onClick={() => window.location.href = `mailto:${client.email}`}
              >
                <Mail className="icon--sm" style={{ marginRight: '0.5rem' }} />
                Email
              </Button>
            )}
          </div>
        </Card>

        {client.health_info && (
          <Card className="health-card">
            <h3 className="health-card__title">Health Information</h3>
            <p className="health-card__content">{client.health_info}</p>
          </Card>
        )}

        <Card className="tags-section">
          <h3 className="tags-section__title">Tags</h3>
          <div className="tags-section__list">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" style={{ height: '1.75rem' }}>
                  <Plus className="icon--sm" style={{ marginRight: '0.25rem' }} />
                  Add tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tag</DialogTitle>
                </DialogHeader>
                <div className="dialog-form">
                  <div className="dialog-form__field">
                    <Label htmlFor="tag">Tag Name</Label>
                    <Input
                      id="tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="e.g., Morning preferred"
                    />
                  </div>
                  <Button onClick={addTag} className="w-full">
                    Add Tag
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Card>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="notes" className="space-y-3 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="icon--sm" style={{ marginRight: '0.5rem' }} />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Note</DialogTitle>
                </DialogHeader>
                <div className="dialog-form">
                  <div className="dialog-form__field">
                    <Label htmlFor="note">Note Content</Label>
                    <Textarea
                      id="note"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add session notes, technique reminders, progress updates..."
                      rows={5}
                    />
                  </div>
                  <Button onClick={addNote} className="w-full">
                    Save Note
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {notes.length === 0 ? (
              <Card className="empty-state">
                <FileText className="empty-state__icon" style={{ margin: '0 auto var(--spacing-3)' }} />
                <p className="empty-state__text">No notes yet</p>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id} className="note-card">
                  <div className="note-card__header">
                    <div>
                      <p className="note-card__type">{note.note_type}</p>
                      <p className="note-card__date">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <FileText className="icon--sm text-muted" />
                  </div>
                  <p className="note-card__content">{note.content}</p>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="media" className="space-y-4 mt-4">
            <ClientMediaUpload clientId={client.id} onUploadComplete={fetchClientData} />
            
            {media.length === 0 ? (
              <Card className="empty-state">
                <div className="flex justify-center gap-2 mb-3">
                  <Image className="empty-state__icon" />
                  <Video className="empty-state__icon" />
                </div>
                <p className="empty-state__text">No media uploaded yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {media.map((item) => (
                  <ClientMediaCard key={item.id} media={item} onUpdate={fetchClientData} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sessions" className="mt-4">
            <Card className="empty-state">
              <p className="empty-state__text">Session history will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />

      <EditClientDialog
        client={client}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onClientUpdated={fetchClientData}
      />
    </div>
  );
};

export default ClientProfile;
