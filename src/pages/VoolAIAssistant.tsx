import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import VoolAIChat from "@/components/VoolAIChat";

const VoolAIAssistant = () => {
  return (
    <div className="page page--with-nav flex flex-col h-screen">
      <Header />
      <main className="flex-1 container py-4 flex">
        <VoolAIChat />
      </main>
      <MobileNav />
    </div>
  );
};

export default VoolAIAssistant;
