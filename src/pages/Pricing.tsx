import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package, Trash2, Edit2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import "@/styles/app.css";

interface CoachPackage {
  id: string;
  name: string;
  description: string | null;
  session_count: number;
  price: number;
  discount_percentage: number;
  is_active: boolean;
}

const Pricing = () => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [packages, setPackages] = useState<CoachPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<CoachPackage | null>(null);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    session_count: 1,
    price: 0,
    discount_percentage: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch hourly rate
    const { data: profile } = await supabase
      .from("profiles")
      .select("hourly_rate")
      .eq("id", user?.id)
      .single();
    
    if (profile) {
      setHourlyRate(profile.hourly_rate);
    }
    
    // Fetch packages
    const { data: pkgs } = await supabase
      .from("coach_packages")
      .select("*")
      .eq("coach_id", user?.id)
      .order("price", { ascending: true });
    
    if (pkgs) {
      setPackages(pkgs);
    }
    
    setLoading(false);
  };

  const handleSaveHourlyRate = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ hourly_rate: hourlyRate })
      .eq("id", user?.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update hourly rate",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Saved",
        description: "Hourly rate updated"
      });
    }
  };

  const handleSubmitPackage = async () => {
    if (!formData.name || formData.price <= 0 || formData.session_count <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (editingPackage) {
      const { error } = await supabase
        .from("coach_packages")
        .update({
          name: formData.name,
          description: formData.description || null,
          session_count: formData.session_count,
          price: formData.price,
          discount_percentage: formData.discount_percentage
        })
        .eq("id", editingPackage.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update package",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Updated",
          description: "Package updated successfully"
        });
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("coach_packages")
        .insert({
          coach_id: user?.id,
          name: formData.name,
          description: formData.description || null,
          session_count: formData.session_count,
          price: formData.price,
          discount_percentage: formData.discount_percentage
        });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create package",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Created",
          description: "New package created"
        });
        fetchData();
      }
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleDeletePackage = async (id: string) => {
    const { error } = await supabase
      .from("coach_packages")
      .delete()
      .eq("id", id);
    
    if (!error) {
      toast({
        title: "Deleted",
        description: "Package removed"
      });
      fetchData();
    }
  };

  const openEditDialog = (pkg: CoachPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      session_count: pkg.session_count,
      price: pkg.price,
      discount_percentage: pkg.discount_percentage
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      description: "",
      session_count: 1,
      price: 0,
      discount_percentage: 0
    });
  };

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section">
        <div className="page-header">
          <h1 className="page-title">Pricing</h1>
          <p className="page-subtitle">Set your rates and training packages</p>
        </div>

        {/* Hourly Rate */}
        <section className="client-portal__section">
          <h2 className="client-portal__section-title">Hourly Rate</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Enter hourly rate"
                  value={hourlyRate || ""}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-muted-foreground">/hr</span>
                <Button onClick={handleSaveHourlyRate}>Save</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Packages */}
        <section className="client-portal__section">
          <div className="flex items-center justify-between mb-3">
            <h2 className="client-portal__section-title mb-0">Training Packages</h2>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Package
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPackage ? "Edit Package" : "Create Package"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Package Name *</label>
                    <Input
                      placeholder="e.g. Starter Pack"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <Textarea
                      placeholder="Describe what's included..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="form-label">Sessions *</label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.session_count}
                        onChange={(e) => setFormData({ ...formData, session_count: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price ($) *</label>
                      <Input
                        type="number"
                        min={0}
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount %</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmitPackage}>
                    {editingPackage ? "Update Package" : "Create Package"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : packages.length === 0 ? (
            <div className="empty-state">
              <Package className="empty-state__icon" />
              <p>No packages yet</p>
              <p className="empty-state__hint">Create packages to offer bundled sessions</p>
            </div>
          ) : (
            <div className="packages-list">
              {packages.map((pkg) => (
                <Card key={pkg.id} className="package-card">
                  <CardContent className="package-card__content">
                    <div className="package-card__header">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="package-card__name">{pkg.name}</h3>
                      <div className="package-card__actions">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(pkg)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePackage(pkg.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="package-card__sessions">{pkg.session_count} sessions</p>
                    {pkg.description && (
                      <p className="package-card__desc">{pkg.description}</p>
                    )}
                    <div className="package-card__price">
                      <span className="package-card__amount">${pkg.price}</span>
                      {pkg.discount_percentage > 0 && (
                        <span className="package-card__discount-text">{pkg.discount_percentage}% off</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default Pricing;
