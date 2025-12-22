
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const InvoiceTable = ({ invoices }) => {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        No invoices found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice ID</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell className="font-medium">{invoice.id.substring(0, 8)}</TableCell>
            <TableCell>{invoice.client}</TableCell>
            <TableCell>{invoice.amount}</TableCell>
            <TableCell>{invoice.dueDate}</TableCell>
            <TableCell>
              <Badge variant={invoice.status.toLowerCase() === 'paid' ? 'default' : invoice.status.toLowerCase() === 'pending' ? 'secondary' : invoice.status.toLowerCase() === 'overdue' ? 'destructive' : 'outline'}>
                {invoice.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InvoiceTable;
