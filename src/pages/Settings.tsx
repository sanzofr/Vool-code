import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Save, Award, Briefcase, X, Plus, LogOut, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import AvatarUpload from "@/components/AvatarUpload";
import "@/styles/app.css";

const Settings = () => {
  const { user } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCert, setNewCert] = useState("");
  
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    bio: "",
    sport_specialty: "",
    experience_years: 0,
    certifications: [] as string[],
    is_available: true,
    avatar_url: null as string | null,
    whatsapp: "",
    telegram: ""
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone_number, bio, sport_specialty, experience_years, certifications, is_available, avatar_url, whatsapp, telegram")
      .eq("id", user?.id)
      .single();
    
    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        phone_number: data.phone_number || "",
        bio: data.bio || "",
        sport_specialty: data.sport_specialty || "",
        experience_years: data.experience_years || 0,
        certifications: data.certifications || [],
        is_available: data.is_available ?? true,
        avatar_url: data.avatar_url || null,
        whatsapp: data.whatsapp || "",
        telegram: data.telegram || ""
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
        sport_specialty: profile.sport_specialty,
        experience_years: profile.experience_years,
        certifications: profile.certifications,
        is_available: profile.is_available,
        whatsapp: profile.whatsapp,
        telegram: profile.telegram
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

  const handleAddCert = () => {
    if (newCert.trim() && !profile.certifications.includes(newCert.trim())) {
      setProfile({
        ...profile,
        certifications: [...profile.certifications, newCert.trim()]
      });
      setNewCert("");
    }
  };

  const handleRemoveCert = (cert: string) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter(c => c !== cert)
    });
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
      <div className="page page--with-nav">
        <Header />
        <main className="container section">
          <div className="loading-state">Loading...</div>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Settings</h2>
            <p className="text-muted-foreground text-sm">Manage your profile and preferences</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Profile Header with Avatar Upload */}
        <div className="profile-header">
          <AvatarUpload
            userId={user?.id || ""}
            currentUrl={profile.avatar_url}
            initials={getInitials()}
            onUpload={(url) => setProfile({ ...profile, avatar_url: url })}
            size="lg"
          />
          <h1 className="page-title mt-3">{profile.first_name} {profile.last_name}</h1>
          {profile.sport_specialty && (
            <Badge variant="secondary">{profile.sport_specialty}</Badge>
          )}
        </div>

        {/* Personal Information */}
        <section>
          <h3 className="client-portal__section-title">Personal Information</h3>
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

        {/* Contact Methods */}
        <section>
          <h3 className="client-portal__section-title">Contact Methods</h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  <MessageCircle className="icon--xs" /> WhatsApp
                </label>
                <Input
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                  placeholder="e.g. +1234567890"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <MessageCircle className="icon--xs" /> Telegram
                </label>
                <Input
                  value={profile.telegram}
                  onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                  placeholder="e.g. @username"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Coach Profile */}
        <section>
          <h3 className="client-portal__section-title">Coach Profile</h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  <Briefcase className="icon--xs" /> Sport Specialty
                </label>
                <Input
                  value={profile.sport_specialty}
                  onChange={(e) => setProfile({ ...profile, sport_specialty: e.target.value })}
                  placeholder="e.g. Tennis, Boxing, Swimming"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Award className="icon--xs" /> Years of Experience
                </label>
                <Input
                  type="number"
                  min={0}
                  value={profile.experience_years}
                  onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell clients about yourself, your coaching style, and experience..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Available for Booking</label>
                  <Button
                    variant={profile.is_available ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, is_available: !profile.is_available })}
                  >
                    {profile.is_available ? "Available" : "Not Available"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Certifications */}
        <section>
          <h3 className="client-portal__section-title">Certifications</h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  placeholder="Add a certification..."
                  onKeyDown={(e) => e.key === "Enter" && handleAddCert()}
                />
                <Button onClick={handleAddCert} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {profile.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.certifications.map((cert, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1.5 px-3">
                      {cert}
                      <button onClick={() => handleRemoveCert(cert)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications added yet</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Save Button */}
        <Button 
          className="w-full btn--primary" 
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </main>

      <MobileNav />
    </div>
  );
};

export default Settings;
