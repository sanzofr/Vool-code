import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientProfile from "./pages/ClientProfile";
import Schedule from "./pages/Schedule";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SelectRole from "./pages/SelectRole";
import FindCoaches from "./pages/FindCoaches";
import CoachProfilePage from "./pages/CoachProfile";
import MySessions from "./pages/MySessions";
import MyProfile from "./pages/MyProfile";
import Pricing from "./pages/Pricing";
import BookingManagement from "./pages/BookingManagement";
import Messages from "./pages/Messages";
import VoolAIAssistant from "./pages/VoolAIAssistant";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/select-role" element={<SelectRole />} />
          
          {/* Coach routes */}
          <Route path="/" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <Clients />
            </ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <ClientProfile />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <Schedule />
            </ProtectedRoute>
          } />
          <Route path="/pricing" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <Pricing />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <BookingManagement />
            </ProtectedRoute>
          } />
           <Route path="/vool-ai" element={
            <ProtectedRoute allowedRoles={["coach", "admin"]}>
              <VoolAIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute allowedRoles={["coach", "admin", "client"]}>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/messages/:partnerId" element={
            <ProtectedRoute allowedRoles={["coach", "admin", "client"]}>
              <Messages />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={["coach", "admin", "client"]}>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Client routes */}
          <Route path="/client-dashboard" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ClientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/find-coaches" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <FindCoaches />
            </ProtectedRoute>
          } />
          <Route path="/coach/:id" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <CoachProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/my-sessions" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MySessions />
            </ProtectedRoute>
          } />
          <Route path="/my-profile" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MyProfile />
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
