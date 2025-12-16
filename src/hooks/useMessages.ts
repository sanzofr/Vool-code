import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useMessages = (partnerId?: string) => {
  const { user } = useUserRole();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (partnerId) {
      fetchMessages(partnerId);
      markAsRead(partnerId);
    } else {
      fetchConversations();
    }

    // Subscribe to realtime messages
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === user.id || newMessage.receiver_id === user.id) {
            if (partnerId && (newMessage.sender_id === partnerId || newMessage.receiver_id === partnerId)) {
              setMessages(prev => [...prev, newMessage]);
              if (newMessage.sender_id === partnerId) {
                markAsRead(partnerId);
              }
            } else {
              fetchConversations();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId]);

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    // Get all messages involving the user
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!allMessages) {
      setLoading(false);
      return;
    }

    // Group by conversation partner
    const conversationMap = new Map<string, { messages: Message[], unread: number }>();
    
    allMessages.forEach(msg => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, { messages: [], unread: 0 });
      }
      const conv = conversationMap.get(partnerId)!;
      conv.messages.push(msg);
      if (!msg.is_read && msg.receiver_id === user.id) {
        conv.unread++;
      }
    });

    // Get partner profiles
    const partnerIds = Array.from(conversationMap.keys());
    if (partnerIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", partnerIds);

    const convList: Conversation[] = [];
    conversationMap.forEach((data, partnerId) => {
      const profile = profiles?.find(p => p.id === partnerId);
      const lastMsg = data.messages[0];
      convList.push({
        partnerId,
        partnerName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
        partnerAvatar: profile?.avatar_url || null,
        lastMessage: lastMsg.content,
        lastMessageTime: lastMsg.created_at,
        unreadCount: data.unread
      });
    });

    // Sort by last message time
    convList.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    setConversations(convList);
    setLoading(false);
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim()
    });

    return !error;
  };

  const markAsRead = async (otherUserId: string) => {
    if (!user) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);
  };

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    refetchConversations: fetchConversations
  };
};
