import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CoachFeed from "@/components/CoachFeed";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    todaysSessions: 0,
    pendingPayments: "$0",
    monthlyRevenue: "$0",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total clients
        const { count: clientsCount } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true });

        // Get today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count: sessionsCount } = await supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .gte("session_date", today.toISOString())
          .lt("session_date", tomorrow.toISOString())
          .eq("status", "upcoming");

        // Get pending payments
        const { data: pendingPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "pending");

        const totalPending = pendingPayments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

        // Get monthly revenue
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const { data: monthlyPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "paid")
          .gte("payment_date", startOfMonth.toISOString());

        const monthlyTotal = monthlyPayments?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

        setStats({
          totalClients: clientsCount || 0,
          todaysSessions: sessionsCount || 0,
          pendingPayments: `$${totalPending.toFixed(0)}`,
          monthlyRevenue: `$${monthlyTotal.toFixed(0)}`,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__content">
          <div className="loading__spinner"></div>
          <p className="loading__text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section space-y-6">
        <div className="dashboard__welcome">
          <h2 className="dashboard__welcome-title">Welcome back, Coach!</h2>
          <p className="dashboard__welcome-subtitle">Here's what's happening today</p>
        </div>

        <div className="dashboard__stats">
          <StatCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            color="primary"
          />
          <StatCard
            title="Today's Sessions"
            value={stats.todaysSessions}
            icon={Calendar}
            trend={`${stats.todaysSessions} upcoming`}
            color="secondary"
          />
          <StatCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={DollarSign}
            color="warning"
          />
          <StatCard
            title="This Month"
            value={stats.monthlyRevenue}
            icon={TrendingUp}
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
           <Button 
            className="action-button"
            onClick={() => navigate("/clients")}
          >
            <Users className="action-button__icon" />
            <span>Manage Clients</span>
          </Button>
          <Button 
            variant="secondary" 
            className="action-button"
            onClick={() => navigate("/schedule")}
          >
            <Calendar className="action-button__icon" />
            <span>View Schedule</span>
          </Button>
           <Button 
            variant="secondary" 
            className="action-button"
            onClick={() => navigate("/vool-ai")}
          >
            <Sparkles className="action-button__icon" />
            <span>Vool AI</span>
          </Button>
        </div>

        {/* Feed Section */}
        <CoachFeed />
      </main>

      <MobileNav />
    </div>
  );
};

export default Dashboard;
