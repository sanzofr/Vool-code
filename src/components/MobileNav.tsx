import { Home, Users, Calendar, DollarSign, MessageCircle, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const MobileNav = () => {
  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/clients", icon: Users, label: "Clients" },
    { to: "/schedule", icon: Calendar, label: "Schedule" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="mobile-nav">
      <div className="mobile-nav__inner">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="mobile-nav__link"
            activeClassName="mobile-nav__link--active"
          >
            <item.icon className="mobile-nav__icon" />
            <span className="mobile-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
