import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const NewMessageDialog = () => {
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchContacts();
    }
  }, [open, user, role]);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);

    if (role === 'coach') {
      // Fetch coach's clients - both manual and registered
      const [manualClients, registeredClients] = await Promise.all([
        // Manual clients from clients table
        supabase
          .from("clients")
          .select("id, first_name, last_name")
          .eq("coach_id", user.id),
        // Registered clients from coach_client_relationships
        supabase
          .from("coach_client_relationships")
          .select("client_id")
          .eq("coach_id", user.id)
          .eq("status", "active")
      ]);

      const contactList: Contact[] = [];

      // Add manual clients (they don't have profiles, so no avatar)
      if (manualClients.data) {
        manualClients.data.forEach(client => {
          contactList.push({
            id: client.id,
            first_name: client.first_name,
            last_name: client.last_name,
            avatar_url: null
          });
        });
      }

      // Fetch profiles for registered clients
      if (registeredClients.data && registeredClients.data.length > 0) {
        const clientIds = registeredClients.data.map(r => r.client_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", clientIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            // Avoid duplicates
            if (!contactList.find(c => c.id === profile.id)) {
              contactList.push(profile);
            }
          });
        }
      }

      setContacts(contactList);
    } else {
      // Client fetching their coaches
      const { data: relationships } = await supabase
        .from("coach_client_relationships")
        .select("coach_id")
        .eq("client_id", user.id)
        .eq("status", "active");

      if (relationships && relationships.length > 0) {
        const coachIds = relationships.map(r => r.coach_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", coachIds);
        
        setContacts(profiles || []);
      } else {
        setContacts([]);
      }
    }

    setLoading(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const handleSelectContact = (contactId: string) => {
    setOpen(false);
    navigate(`/messages/${contactId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${role === 'coach' ? 'clients' : 'coaches'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'No contacts found' : `No ${role === 'coach' ? 'clients' : 'coaches'} yet`}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(contact.first_name, contact.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;
