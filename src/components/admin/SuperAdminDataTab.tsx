import React, { useState } from "react";
import { CheckCircle, XCircle, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { WasteEntry } from "@/types";

interface SuperAdminDataTabProps {
  wasteEntries: WasteEntry[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClearAll: () => void;
}

export default function SuperAdminDataTab({
  wasteEntries,
  onApprove,
  onReject,
  onClearAll,
}: SuperAdminDataTabProps) {
  const [filterText, setFilterText] = useState("");

  const filteredEntries = wasteEntries.filter(
    (entry) =>
      entry.employee_id?.toLowerCase().includes(filterText.toLowerCase()) ||
      entry.employeeName?.toLowerCase().includes(filterText.toLowerCase()) ||
      entry.wasteType?.toString().toLowerCase().includes(filterText.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Date", "Employee ID", "Employee Name", "Waste Type", "Amount (kg)", "Location", "Status"];
    const rows = wasteEntries.map((e) => [
      e.created_at || e.dateTime || "N/A",
      e.employee_id || "N/A",
      e.employeeName || "N/A",
      e.wasteType?.toString() || "N/A",
      e.amount || 0,
      e.location || "N/A",
      e.status || "pending",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waste-entries-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Filter by employee, ID, or waste type..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={onClearAll} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Waste Type</TableHead>
              <TableHead>Amount (kg)</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {entry.created_at || entry.dateTime || "N/A"}
                </TableCell>
                <TableCell className="font-mono text-sm">{entry.employee_id}</TableCell>
                <TableCell>{entry.employeeName || "N/A"}</TableCell>
                <TableCell>{entry.wasteType?.toString() || "N/A"}</TableCell>
                <TableCell>{entry.amount} kg</TableCell>
                <TableCell className="text-muted-foreground">{entry.location}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      entry.status === "approved"
                        ? "default"
                        : entry.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {entry.status || "pending"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(entry.id)}
                      disabled={entry.status === "approved"}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(entry.id)}
                      disabled={entry.status === "rejected"}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No waste entries found</p>
        </div>
      )}
    </div>
  );
}
