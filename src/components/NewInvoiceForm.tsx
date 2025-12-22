
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NewInvoiceForm = ({ onSave }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceType, setInvoiceType] = useState("one-time");
  const [recurringDay, setRecurringDay] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data, error } = await supabase.from("clients").select("id, first_name, last_name").eq('coach_id', user.id);
          if (data) {
            setClients(data);
          }
      }
    };
    fetchClients();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({
            title: "Error",
            description: "You must be logged in to create an invoice.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
    }

    if (!firstName || !lastName || !amount || !dueDate) {
        toast({
            title: "Error",
            description: "Please fill out all required fields.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
    }
    
    let client = clients.find(c => c.first_name.toLowerCase() === firstName.toLowerCase() && c.last_name.toLowerCase() === lastName.toLowerCase());
    let clientId;

    if (client) {
        clientId = client.id;
    } else {
        const { data: newClient, error: newClientError } = await supabase
            .from('clients')
            .insert({ first_name: firstName, last_name: lastName, coach_id: user.id })
            .select('id')
            .single();

        if (newClientError) {
            toast({
                title: "Error creating new client",
                description: newClientError.message,
                variant: "destructive",
            });
            setIsSaving(false);
            return;
        }
        clientId = newClient.id;
    }

    const invoiceData = {
      coach_id: user.id,
      client_id: clientId,
      amount: parseFloat(amount),
      due_date: dueDate,
      status: 'pending',
      type: invoiceType,
      recurring_day: invoiceType === 'recurring' ? parseInt(recurringDay, 10) : null,
    };

    const { data, error } = await supabase.from('invoices').insert([invoiceData]).select();

    if (error) {
      toast({
        title: "Error creating invoice",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Invoice created",
        description: "The new invoice has been created successfully.",
      });
      onSave(data[0]);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="firstName">First Name</Label>
        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name</Label>
        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="amount">Amount</Label>
        <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="due-date">Due Date</Label>
        <Input id="due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="invoice-type">Invoice Type</Label>
        <Select onValueChange={setInvoiceType} value={invoiceType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time">One-Time</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {invoiceType === "recurring" && (
        <div>
          <Label htmlFor="recurring-day">Day of Month</Label>
          <Input id="recurring-day" type="number" min="1" max="31" value={recurringDay} onChange={(e) => setRecurringDay(e.target.value)} />
        </div>
      )}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Invoice"}
      </Button>
    </div>
  );
};

export default NewInvoiceForm;
