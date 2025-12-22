
import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import InvoiceTable from "@/components/InvoiceTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import NewInvoiceForm from "@/components/NewInvoiceForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Invoices = () => {
  const { toast } = useToast();
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            id,
            amount,
            due_date,
            status,
            clients (first_name, last_name)
          `)
          .eq('coach_id', user.id);

        if (error) {
          toast({
            title: "Error fetching invoices",
            description: error.message,
            variant: "destructive",
          });
        } else {
          const formattedInvoices = data.map(invoice => ({
            id: invoice.id,
            client: `${invoice.clients.first_name} ${invoice.clients.last_name}`,
            amount: `$${invoice.amount}`,
            dueDate: invoice.due_date,
            status: invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1),
          }));
          setInvoices(formattedInvoices);
        }
    }
  };

  const handleSaveInvoice = (newInvoice) => {
    setIsNewInvoiceOpen(false);
    fetchInvoices();
  };

  return (
    <div className="page page--with-nav">
      <Header />
      
      <main className="container section space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Invoices</h2>
            <p className="text-muted-foreground">
              Create and manage your client invoices.
            </p>
          </div>
          <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <NewInvoiceForm onSave={handleSaveInvoice} />
            </DialogContent>
          </Dialog>
        </div>

        <InvoiceTable invoices={invoices} />
      </main>

      <MobileNav />
    </div>
  );
};

export default Invoices;
