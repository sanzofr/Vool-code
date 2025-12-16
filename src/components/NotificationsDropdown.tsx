import { Bell, Check, X, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, createNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NotificationsDropdown = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refetch } = useNotifications();
  const { toast } = useToast();

  const handleAcceptBooking = async (notification: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const bookingRequestId = notification.data?.booking_request_id;
    const clientId = notification.data?.client_id;
    
    if (!bookingRequestId || !clientId) {
      toast({ title: "Error", description: "Invalid booking request", variant: "destructive" });
      return;
    }

    try {
      // Get current user (coach)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update booking request status
      await supabase
        .from("booking_requests")
        .update({ status: "accepted" })
        .eq("id", bookingRequestId);

      // Check if relationship exists
      const { data: existingRel } = await supabase
        .from("coach_client_relationships")
        .select("id")
        .eq("coach_id", user.id)
        .eq("client_id", clientId)
        .single();

      if (existingRel) {
        // Update existing relationship
        await supabase
          .from("coach_client_relationships")
          .update({ status: "active" })
          .eq("id", existingRel.id);
      } else {
        // Create new relationship
        await supabase.from("coach_client_relationships").insert({
          coach_id: user.id,
          client_id: clientId,
          status: "active"
        });
      }

      // Notify the client
      await createNotification(
        clientId,
        "booking_accepted",
        "Booking Accepted! 🎉",
        "Your booking request has been accepted. You can now start your training!",
        { coach_id: user.id }
      );

      // Mark notification as read and refresh
      await markAsRead(notification.id);
      toast({ title: "Booking accepted", description: "Client has been notified" });
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast({ title: "Error", description: "Failed to accept booking", variant: "destructive" });
    }
  };

  const handleRejectBooking = async (notification: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const bookingRequestId = notification.data?.booking_request_id;
    const clientId = notification.data?.client_id;
    
    if (!bookingRequestId || !clientId) {
      toast({ title: "Error", description: "Invalid booking request", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update booking request status
      await supabase
        .from("booking_requests")
        .update({ status: "rejected" })
        .eq("id", bookingRequestId);

      // Notify the client
      await createNotification(
        clientId,
        "booking_rejected",
        "Booking Request Update",
        "Unfortunately, your booking request was not accepted. Please try another coach or time.",
        { coach_id: user.id }
      );

      // Mark notification as read
      await markAsRead(notification.id);
      toast({ title: "Booking rejected", description: "Client has been notified" });
    } catch (error) {
      console.error("Error rejecting booking:", error);
      toast({ title: "Error", description: "Failed to reject booking", variant: "destructive" });
    }
  };

  const isBookingRequest = (notification: any) => {
    return notification.type === "booking_request" && !notification.is_read;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="icon" />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-7">
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-muted/50 cursor-pointer ${
                  !notification.is_read ? 'bg-primary/5' : ''
                }`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    
                    {/* Accept/Reject buttons for booking requests */}
                    {isBookingRequest(notification) && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => handleAcceptBooking(notification, e)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => handleRejectBooking(notification, e)}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsDropdown;
