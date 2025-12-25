import { LogOut, Home, Users, Calendar, Settings, DollarSign, Inbox, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { NavLink } from "@/components/NavLink";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import logo from "@/assets/logo.jpg";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You've been logged out successfully.",
    });
    navigate("/auth");
  };

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/clients", icon: Users, label: "Clients" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/bookings", icon: Inbox, label: "Bookings" },
    { to: "/pricing", icon: DollarSign, label: "Pricing" },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/vool-ai", icon: Bot, label: "AI Assistant" },
  ];

  return (
    <header className="header">
      <div className="container header__inner">
        <div className="header__left">
          <img src={logo} alt="Vool" className="header__logo-img" />
          
          <nav className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="desktop-nav__link"
                activeClassName="desktop-nav__link--active"
              >
                <item.icon className="desktop-nav__icon" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="header__actions">
          <NotificationsDropdown />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="icon" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
