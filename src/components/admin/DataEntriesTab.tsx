import { useState } from "react";
import { Search, Eye, Download, Camera, CameraOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Badge } from "@/components/ui/badge";
import type { WasteEntry } from "@/types";

interface DataEntriesTabProps {
  wasteEntries: WasteEntry[];
}

export default function DataEntriesTab({ wasteEntries }: DataEntriesTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEntries = wasteEntries.filter(
    entry => 
      entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.wasteType.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Waste Type', 'Amount (kg)', 'Date & Time', 'Status'];
    const csvData = filteredEntries.map(entry => [
      entry.employeeName,
      entry.employeeId,
      entry.wasteType.name,
      entry.amount,
      formatDate(entry.dateTime),
      entry.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `waste_entries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Waste Entries Data
          </h2>
          <p className="text-muted-foreground">
            View and manage all waste collection entries
          </p>
        </div>
        <EcoButton variant="outline" onClick={exportToCSV}>
          <Download className="w-4 h-4" />
          Export Data
        </EcoButton>
      </div>

      <Card className="shadow-card border-card-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Entries ({filteredEntries.length})</CardTitle>
              <CardDescription>
                Complete list of waste collection entries
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <InputWithIcon
                icon={<Search className="w-4 h-4" />}
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Waste Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.employeeName}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{entry.wasteType.icon}</span>
                        <span>{entry.wasteType.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{entry.amount} kg</TableCell>
                    <TableCell className="text-sm">
                      {formatDate(entry.dateTime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.imageUrl ? (
                          <>
                            <Camera className="w-4 h-4 text-success" />
                            <span className="text-sm text-success">Yes</span>
                          </>
                        ) : (
                          <>
                            <CameraOff className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">No</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.imageUrl && (
                        <EcoButton variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </EcoButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}