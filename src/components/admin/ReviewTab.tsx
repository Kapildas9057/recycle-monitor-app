import { useState } from "react";
import { Search, Eye, CheckCircle, XCircle, Camera, CameraOff, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { EcoButton } from "@/components/ui/eco-button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { toast } from "@/hooks/use-toast";
import type { WasteEntry } from "@/types";

interface ReviewTabProps {
  wasteEntries: WasteEntry[];
  onApprove: (entryId: string) => void;
  onReject: (entryId: string, reason?: string) => void;
}

export default function ReviewTab({ wasteEntries, onApprove, onReject }: ReviewTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [photoFilter, setPhotoFilter] = useState<string>("all");
  const [selectedEntry, setSelectedEntry] = useState<WasteEntry | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [entryToReject, setEntryToReject] = useState<string | null>(null);

  const filteredEntries = wasteEntries.filter(entry => {
    const matchesSearch = 
      entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.wasteType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    
    const matchesPhoto = photoFilter === "all" || 
      (photoFilter === "with-photo" && entry.imageUrl) ||
      (photoFilter === "without-photo" && !entry.imageUrl);
    
    return matchesSearch && matchesStatus && matchesPhoto;
  });

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

  const handleApprove = (entryId: string) => {
    onApprove(entryId);
    toast("Entry Approved", { description: "The waste entry has been approved successfully." });
  };

  const handleRejectClick = (entryId: string) => {
    setEntryToReject(entryId);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (entryToReject) {
      onReject(entryToReject, rejectReason);
      toast.error("Entry Rejected", { description: "The waste entry has been rejected." });
      setShowRejectDialog(false);
      setEntryToReject(null);
      setRejectReason("");
    }
  };

  const pendingCount = wasteEntries.filter(e => e.status === 'pending').length;
  const approvedCount = wasteEntries.filter(e => e.status === 'approved').length;
  const rejectedCount = wasteEntries.filter(e => e.status === 'rejected').length;
  const totalEntries = wasteEntries.length;
  const totalWasteCollected = wasteEntries
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
                <p className="text-muted-foreground">Total Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                <p className="text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{rejectedCount}</p>
                <p className="text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{totalWasteCollected.toFixed(1)} kg</p>
                <p className="text-muted-foreground">Total Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header and Filters */}
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Entry Review & Approval
          </h2>
          <p className="text-muted-foreground">
            Review waste entries, verify photos, and approve or reject submissions
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <InputWithIcon
              icon={<Search className="w-4 h-4" />}
              placeholder="Search by employee, ID, or waste type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={photoFilter} onValueChange={setPhotoFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by photo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="with-photo">With Photo</SelectItem>
              <SelectItem value="without-photo">Without Photo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review Table */}
      <Card className="shadow-card border-card-border">
        <CardHeader>
          <CardTitle>Waste Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>
            Review and approve waste collection submissions
          </CardDescription>
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
                  <TableHead>Photo Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <span>{entry.employeeName}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{entry.employeeId}</TableCell>
                    <TableCell>
                      <span>{entry.wasteType}</span>
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
                            <Badge className="bg-success text-success-foreground">
                              Photo Attached
                            </Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <EcoButton variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </EcoButton>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Photo Verification</DialogTitle>
                                  <DialogDescription>
                                    Photo submitted by {entry.employeeName} for {entry.wasteType}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <img 
                                    src={entry.imageUrl} 
                                    alt="Waste submission" 
                                    className="max-w-full max-h-96 object-contain rounded-lg"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        ) : (
                          <>
                            <CameraOff className="w-4 h-4 text-destructive" />
                            <Badge className="bg-destructive text-destructive-foreground">
                              No Photo Provided
                            </Badge>
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
                      <div className="flex gap-2">
                        {entry.status === 'pending' && (
                          <>
                            <EcoButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(entry.id)}
                              className="text-success border-success hover:bg-success hover:text-success-foreground"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </EcoButton>
                            <EcoButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectClick(entry.id)}
                              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </EcoButton>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Entry</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this waste entry (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Reason for rejection</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <EcoButton variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </EcoButton>
            <EcoButton variant="outline" onClick={confirmReject} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
              Reject Entry
            </EcoButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}