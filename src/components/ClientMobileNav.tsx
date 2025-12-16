import { Home, Users, Calendar, MessageCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const ClientMobileNav = () => {
  const navItems = [
    { to: "/client-dashboard", icon: Home, label: "Home" },
    { to: "/find-coaches", icon: Users, label: "Coaches" },
    { to: "/my-sessions", icon: Calendar, label: "Sessions" },
    { to: "/messages", icon: MessageCircle, label: "Messages" },
    { to: "/my-profile", icon: User, label: "Profile" },
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

export default ClientMobileNav;
