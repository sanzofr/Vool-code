import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages } from "@/hooks/useMessages";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import MobileNav from "@/components/MobileNav";
import ClientMobileNav from "@/components/ClientMobileNav";
import NewMessageDialog from "@/components/NewMessageDialog";

const Messages = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useUserRole();
  const { messages, conversations, loading, sendMessage, refetchConversations } = useMessages(partnerId);
  const [newMessage, setNewMessage] = useState("");
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (partnerId) {
      fetchPartnerProfile();
    }
  }, [partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPartnerProfile = async () => {
    if (!partnerId) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .eq("id", partnerId)
      .single();
    setPartnerProfile(data);
  };

  const handleSend = async () => {
    if (!partnerId || !newMessage.trim()) return;
    const success = await sendMessage(partnerId, newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Conversation List View
  if (!partnerId) {
    return (
      <div className="app-container">
        <header className="page-header flex items-center justify-between">
          <h1 className="page-title">Messages</h1>
          <NewMessageDialog />
        </header>

        <main className="page-content">
          {loading ? (
            <div className="loading-state">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <p>No messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Start a conversation with {role === 'coach' ? 'your clients' : 'your coaches'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/messages/${conv.partnerId}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.partnerAvatar || undefined} />
                    <AvatarFallback>{getInitials(conv.partnerName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.partnerName}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>

        {role === 'coach' ? <MobileNav /> : <ClientMobileNav />}
      </div>
    );
  }

  // Chat View
  return (
    <div className="app-container flex flex-col h-screen">
      <header className="page-header flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {partnerProfile && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={partnerProfile.avatar_url || undefined} />
              <AvatarFallback>
                {getInitials(`${partnerProfile.first_name} ${partnerProfile.last_name}`)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {partnerProfile.first_name} {partnerProfile.last_name}
            </span>
          </div>
        )}
      </header>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.sender_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
