import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, Mail, Phone, Save, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ClientMobileNav from "@/components/ClientMobileNav";
import AvatarUpload from "@/components/AvatarUpload";
import logo from "@/assets/logo.jpg";
import "@/styles/app.css";

const MyProfile = () => {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    bio: "",
    sport_specialty: "",
    avatar_url: null as string | null
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone_number, bio, sport_specialty, avatar_url")
      .eq("id", user?.id)
      .single();
    
    if (profileData) {
      setProfile({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        email: profileData.email || "",
        phone_number: profileData.phone_number || "",
        bio: profileData.bio || "",
        sport_specialty: profileData.sport_specialty || "",
        avatar_url: profileData.avatar_url || null
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone_number: profile.phone_number,
        bio: profile.bio,
        sport_specialty: profile.sport_specialty
      })
      .eq("id", user?.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved",
        description: "Your profile has been updated"
      });
    }
    
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully."
    });
    navigate("/auth");
  };

  const getInitials = () => {
    return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase() || "?";
  };

  if (loading) {
    return (
      <div className="client-portal page--with-nav">
        <header className="client-portal__header">
          <div className="client-portal__header-inner">
            <div className="client-portal__brand">
              <img src={logo} alt="Vool" className="client-portal__logo-img" />
            </div>
          </div>
        </header>
        <main className="client-portal__main">
          <div className="loading-state">Loading...</div>
        </main>
        <ClientMobileNav />
      </div>
    );
  }

  return (
    <div className="client-portal page--with-nav">
      {/* Header */}
      <header className="client-portal__header">
        <div className="client-portal__header-inner">
          <div className="client-portal__brand">
            <img src={logo} alt="Vool" className="client-portal__logo-img" />
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="client-portal__main">
        <section className="client-portal__section">
          <div className="profile-header">
            <AvatarUpload
              userId={user?.id || ""}
              currentUrl={profile.avatar_url}
              initials={getInitials()}
              onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
              size="lg"
            />
            <h1 className="page-title mt-3">{profile.first_name} {profile.last_name}</h1>
          </div>
        </section>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 mt-4">
            {/* Personal Information */}
            <section className="client-portal__section">
              <h2 className="client-portal__section-title">Personal Information</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">
                        <User className="icon--xs" /> First Name
                      </label>
                      <Input
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        <User className="icon--xs" /> Last Name
                      </label>
                      <Input
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Mail className="icon--xs" /> Email
                    </label>
                    <Input value={profile.email} disabled className="input--disabled" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      <Phone className="icon--xs" /> Phone
                    </label>
                    <Input
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Training Preferences */}
            <section className="client-portal__section">
              <h2 className="client-portal__section-title">Training Preferences</h2>
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="form-group">
                    <label className="form-label">
                      <Heart className="icon--xs" /> Preferred Sport
                    </label>
                    <Input
                      value={profile.sport_specialty}
                      onChange={(e) => setProfile({ ...profile, sport_specialty: e.target.value })}
                      placeholder="e.g. Tennis, Boxing, Swimming"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">About Me</label>
                    <Textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell coaches about your goals and experience..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Save Button */}
            <section className="client-portal__section">
              <Button 
                className="w-full btn--primary" 
                size="lg"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      <ClientMobileNav />
    </div>
  );
};

export default MyProfile;
