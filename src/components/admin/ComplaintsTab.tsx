import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  AlertTriangle, Eye, Trash2, Filter, RefreshCw, MapPin, Phone, User, Calendar,
} from "lucide-react";
import type { Complaint } from "@/types/complaint";

const fdb = getFirestore();

type ComplaintStatus = "open" | "investigating" | "resolved";

const STATUS_OPTIONS: { value: ComplaintStatus; label: string }[] = [
  { value: "open", label: "Pending" },
  { value: "investigating", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const statusBadgeVariant = (status: ComplaintStatus) => {
  switch (status) {
    case "open":
      return "destructive";
    case "investigating":
      return "secondary";
    case "resolved":
      return "default";
    default:
      return "outline";
  }
};

const statusLabel = (status: string) => {
  const found = STATUS_OPTIONS.find((s) => s.value === status);
  return found ? found.label : status;
};

function formatTimestamp(val: unknown): string {
  if (!val) return "—";
  if (val instanceof Timestamp) return val.toDate().toLocaleString();
  if (typeof val === "string") return new Date(val).toLocaleString();
  if (typeof val === "number") return new Date(val).toLocaleString();
  if (val && typeof val === "object" && "seconds" in val) {
    return new Date((val as { seconds: number }).seconds * 1000).toLocaleString();
  }
  return "—";
}

export default function ComplaintsTab() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterWard, setFilterWard] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDate, setFilterDate] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(fdb, "complaints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Complaint[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Complaint, "id">),
        }));
        setComplaints(items);
        setLoading(false);
      },
      (err) => {
        console.error("Complaints listener error:", err);
        toast.error("Failed to load complaints");
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Derived unique wards for filter
  const uniqueWards = Array.from(new Set(complaints.map((c) => c.wardNumber).filter(Boolean))).sort();

  // Filtering
  const filtered = complaints.filter((c) => {
    if (filterWard && c.wardNumber !== filterWard) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterDate) {
      const created = c.createdAt instanceof Timestamp
        ? c.createdAt.toDate()
        : new Date(c.createdAt);
      const dateStr = created.toISOString().split("T")[0];
      if (dateStr !== filterDate) return false;
    }
    return true;
  });

  // Status update
  const handleStatusChange = async (id: string, newStatus: ComplaintStatus) => {
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === "resolved") {
        updateData.resolvedAt = Timestamp.now();
      }
      await updateDoc(doc(fdb, "complaints", id), updateData);
      toast.success(`Status updated to ${statusLabel(newStatus)}`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update status");
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(fdb, "complaints", id));
      toast.success("Complaint deleted");
      if (selectedComplaint?.id === id) {
        setShowDetails(false);
        setSelectedComplaint(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete complaint");
    }
  };

  // Stats
  const totalOpen = complaints.filter((c) => c.status === "open").length;
  const totalInProgress = complaints.filter((c) => c.status === "investigating").length;
  const totalResolved = complaints.filter((c) => c.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{complaints.length}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-destructive">Pending</p>
            <p className="text-2xl font-bold text-destructive">{totalOpen}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-secondary/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-foreground">{totalInProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-primary">Resolved</p>
            <p className="text-2xl font-bold text-primary">{totalResolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select value={filterWard || "all"} onValueChange={(v) => setFilterWard(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="All Wards" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {uniqueWards.map((w) => (
                  <SelectItem key={w} value={w}>Ward {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm"
            />

            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => { setFilterWard(""); setFilterStatus("all"); setFilterDate(""); }}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading complaints...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No complaints found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Submitted By</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className={c.status === "open" ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-mono text-xs">{c.id.slice(0, 8)}…</TableCell>
                      <TableCell>{c.wardNumber}</TableCell>
                      <TableCell className="capitalize">{c.complaintType.replace(/_/g, " ")}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.fullName}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{c.address}</TableCell>
                      <TableCell className="text-xs">{formatTimestamp(c.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(c.status as ComplaintStatus)}>
                          {statusLabel(c.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedComplaint(c); setShowDetails(true); }}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Select
                            value={c.status}
                            onValueChange={(v) => handleStatusChange(c.id, v as ComplaintStatus)}
                          >
                            <SelectTrigger className="w-[110px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this complaint. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Complaint Details
            </DialogTitle>
            <DialogDescription>Full complaint information</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">ID</p>
                  <p className="font-mono text-xs">{selectedComplaint.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={statusBadgeVariant(selectedComplaint.status as ComplaintStatus)}>
                    {statusLabel(selectedComplaint.status)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedComplaint.fullName}</p>
                    <p className="text-muted-foreground">{selectedComplaint.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>{selectedComplaint.address}</p>
                    <p className="text-muted-foreground">Ward {selectedComplaint.wardNumber} · Zone {selectedComplaint.zone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <p>{formatTimestamp(selectedComplaint.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="capitalize font-medium">{selectedComplaint.complaintType.replace(/_/g, " ")}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.imageUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Attached Image</p>
                  <img
                    src={selectedComplaint.imageUrl}
                    alt="Complaint"
                    className="rounded-md border border-border max-h-48 object-cover"
                  />
                </div>
              )}

              {selectedComplaint.resolvedAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Resolved At</p>
                  <p className="text-sm">{formatTimestamp(selectedComplaint.resolvedAt)}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Select
                  value={selectedComplaint.status}
                  onValueChange={(v) => handleStatusChange(selectedComplaint.id, v as ComplaintStatus)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
