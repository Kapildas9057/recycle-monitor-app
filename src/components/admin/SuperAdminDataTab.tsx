import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Trash2, Download, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import type { WasteEntry } from "@/types";

interface SuperAdminDataTabProps {
  wasteEntries: WasteEntry[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClearAll: () => void;
}

// Helper to format dates safely
const formatDate = (dateValue: any): string => {
  if (!dateValue) return "N/A";
  
  try {
    // Handle Firestore Timestamp
    if (dateValue?.toDate) {
      return dateValue.toDate().toLocaleString();
    }
    // Handle ISO string
    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    // Handle Date object
    if (dateValue instanceof Date) {
      return dateValue.toLocaleString();
    }
    // Handle seconds timestamp
    if (typeof dateValue === "number") {
      return new Date(dateValue * 1000).toLocaleString();
    }
    return String(dateValue);
  } catch {
    return "N/A";
  }
};

// Helper to format date for CSV (ISO format)
const formatDateForCSV = (dateValue: any): string => {
  if (!dateValue) return "N/A";
  
  try {
    if (dateValue?.toDate) {
      return dateValue.toDate().toISOString();
    }
    if (typeof dateValue === "string") {
      return dateValue;
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    return String(dateValue);
  } catch {
    return "N/A";
  }
};

export default function SuperAdminDataTab({
  wasteEntries,
  onApprove,
  onReject,
  onClearAll,
}: SuperAdminDataTabProps) {
  const [filterText, setFilterText] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Sort entries by created_at (newest first), handling various date formats
  const sortedEntries = [...wasteEntries].sort((a, b) => {
    const getTime = (entry: WasteEntry) => {
      const dateVal = entry.created_at || entry.dateTime;
      if (!dateVal) return 0;
      if ((dateVal as any)?.toDate) return (dateVal as any).toDate().getTime();
      if (typeof dateVal === "string") return new Date(dateVal).getTime();
      if (typeof dateVal === "number") return dateVal * 1000;
      return 0;
    };
    return getTime(b) - getTime(a);
  });

  const filteredEntries = sortedEntries.filter(
    (entry) =>
      entry.employee_id?.toLowerCase().includes(filterText.toLowerCase()) ||
      entry.employeeName?.toLowerCase().includes(filterText.toLowerCase()) ||
      entry.wasteType?.toString().toLowerCase().includes(filterText.toLowerCase()) ||
      entry.status?.toLowerCase().includes(filterText.toLowerCase())
  );

  const exportToCSV = () => {
    if (wasteEntries.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Entry ID",
      "Employee ID",
      "Employee Name",
      "Waste Type",
      "Amount (kg)",
      "Location",
      "Collection Date",
      "Submitted At",
      "Status"
    ];
    
    const rows = sortedEntries.map((e) => [
      e.id || "N/A",
      e.employee_id || "N/A",
      e.employeeName || "N/A",
      e.wasteType?.toString() || "N/A",
      e.amount || 0,
      e.location || "N/A",
      formatDateForCSV(e.dateTime),
      formatDateForCSV(e.created_at),
      e.status || "pending",
    ]);

    const csv = [headers, ...rows].map((row) => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ecoshift-waste-entries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${sortedEntries.length} entries to CSV`);
  };

  const handleClearAll = () => {
    if (wasteEntries.length === 0) {
      toast.error("No entries to clear");
      return;
    }
    
    if (confirm(`Are you sure you want to delete all ${wasteEntries.length} waste entries? This action cannot be undone.`)) {
      onClearAll();
    }
  };

  const viewDetails = (entry: WasteEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{wasteEntries.length}</span> entries
          </div>
          <div className="text-sm text-muted-foreground">
            Pending: <span className="font-semibold text-amber-600">
              {wasteEntries.filter(e => e.status === 'pending').length}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            Approved: <span className="font-semibold text-green-600">
              {wasteEntries.filter(e => e.status === 'approved').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Filter by employee, ID, type, or status..."
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
          <Button onClick={handleClearAll} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Data table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Submitted At</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Employee Name</TableHead>
              <TableHead>Waste Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/30">
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(entry.created_at || entry.dateTime)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.employee_id || "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.employeeName || "Unknown"}
                  </TableCell>
                  <TableCell>{entry.wasteType?.toString() || "N/A"}</TableCell>
                  <TableCell className="font-semibold">
                    {entry.amount || 0} kg
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[150px] truncate">
                    {entry.location || "N/A"}
                  </TableCell>
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
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetails(entry)}
                        className="text-muted-foreground hover:text-foreground"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(entry.id)}
                        disabled={entry.status === "approved"}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReject(entry.id)}
                        disabled={entry.status === "rejected"}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {filterText ? "No entries match your filter" : "No waste entries found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Entry count */}
      {filteredEntries.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredEntries.length} of {wasteEntries.length} entries
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Waste Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Entry ID</p>
                  <p className="font-mono text-xs">{selectedEntry.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedEntry.status === "approved"
                        ? "default"
                        : selectedEntry.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedEntry.status || "pending"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-mono">{selectedEntry.employee_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Employee Name</p>
                  <p className="font-medium">{selectedEntry.employeeName || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Waste Type</p>
                  <p>{selectedEntry.wasteType || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">{selectedEntry.amount || 0} kg</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Location</p>
                  <p>{selectedEntry.location || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Collection Date</p>
                  <p>{formatDate(selectedEntry.dateTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Submitted At</p>
                  <p>{formatDate(selectedEntry.created_at)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    onApprove(selectedEntry.id);
                    setShowDetails(false);
                  }}
                  disabled={selectedEntry.status === "approved"}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    onReject(selectedEntry.id);
                    setShowDetails(false);
                  }}
                  disabled={selectedEntry.status === "rejected"}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
