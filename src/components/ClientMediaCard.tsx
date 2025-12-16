import { useState, useEffect } from "react";
import { Image, Video, MessageSquare, Trash2, Clock, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ClientMediaCardProps {
  media: ClientMedia;
  onUpdate: () => void;
}

const ClientMediaCard = ({ media, onUpdate }: ClientMediaCardProps) => {
  const { toast } = useToast();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState(media.coach_review || "");
  const [saving, setSaving] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  // Load media URL on mount for preview
  useEffect(() => {
    const { data } = supabase.storage
      .from("client-media")
      .getPublicUrl(media.file_path);
    setMediaUrl(data.publicUrl);
  }, [media.file_path]);

  const handleSaveReview = async () => {
    if (!review.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("client_media")
        .update({
          coach_review: review.trim(),
          review_date: new Date().toISOString(),
        })
        .eq("id", media.id);

      if (error) throw error;

      toast({
        title: "Review saved",
        description: "Your feedback has been saved.",
      });

      setReviewOpen(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Delete from storage
      await supabase.storage
        .from("client-media")
        .remove([media.file_path]);

      // Delete from database
      const { error } = await supabase
        .from("client_media")
        .delete()
        .eq("id", media.id);

      if (error) throw error;

      toast({
        title: "Media deleted",
        description: "The media has been removed.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="overflow-hidden">
      {/* Media preview with actual thumbnail */}
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative h-32 bg-muted cursor-pointer group overflow-hidden">
            {mediaUrl ? (
              media.media_type === "video" ? (
                <>
                  <video 
                    src={mediaUrl} 
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-5 w-5 text-foreground ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={media.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {media.media_type === "video" ? (
                  <Video className="h-10 w-10 text-muted-foreground" />
                ) : (
                  <Image className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{media.title}</DialogTitle>
          </DialogHeader>
          {mediaUrl && (
            media.media_type === "video" ? (
              <video src={mediaUrl} controls className="w-full rounded-lg" />
            ) : (
              <img src={mediaUrl} alt={media.title} className="w-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Info section */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-sm line-clamp-1">{media.title}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {formatDate(media.created_at)}
            </div>
          </div>
        </div>

        {media.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{media.description}</p>
        )}

        {/* Coach review */}
        {media.coach_review && (
          <div className="bg-primary/5 rounded-md p-2 mt-2">
            <p className="text-xs font-medium text-primary mb-1">Coach Review</p>
            <p className="text-xs text-foreground">{media.coach_review}</p>
            {media.review_date && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(media.review_date)}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageSquare className="h-3 w-3 mr-1" />
                {media.coach_review ? "Edit Review" : "Add Review"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {media.coach_review ? "Edit Review" : "Add Review"} - {media.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Write your feedback and coaching notes..."
                  rows={5}
                />
                <Button 
                  onClick={handleSaveReview} 
                  disabled={saving || !review.trim()}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Review"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete media?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{media.title}" and any associated reviews.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};

export default ClientMediaCard;
