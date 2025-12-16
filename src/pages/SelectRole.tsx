import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Users } from "lucide-react";

const SelectRole = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
        // Check if user already has a role
        checkExistingRole(session.user.id);
      }
    });
  }, [navigate]);

  const checkExistingRole = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .single();
    
    if (data?.role) {
      // User already has a role, redirect
      if (data.role === "coach") navigate("/");
      else if (data.role === "client") navigate("/client-dashboard");
      else if (data.role === "admin") navigate("/admin");
    }
  };

  const selectRole = async (role: "coach" | "client") => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;

      toast({
        title: "Role selected!",
        description: role === "coach" 
          ? "Welcome! You can now start managing your clients."
          : "Welcome! Your coach will add you to their client list.",
      });

      if (role === "coach") {
        navigate("/");
      } else {
        navigate("/client-dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Vool</CardTitle>
          <CardDescription>
            Please select how you'll be using Vool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => selectRole("coach")}
            disabled={loading}
          >
            <Users className="h-8 w-8" />
            <div>
              <p className="font-semibold">I'm a Coach</p>
              <p className="text-xs text-muted-foreground">
                Manage clients, schedule sessions, track progress
              </p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-6 flex flex-col items-center gap-2"
            onClick={() => selectRole("client")}
            disabled={loading}
          >
            <User className="h-8 w-8" />
            <div>
              <p className="font-semibold">I'm a Client</p>
              <p className="text-xs text-muted-foreground">
                View sessions, receive coaching materials
              </p>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRole;
