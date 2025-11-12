import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";

const fdb = getFirestore();

interface ApprovalRequest {
  id: string;
  uid: string;
  email: string;
  name: string;
  employee_id: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  created_at: any;
}

export default function SuperAdminApprovalsTab({ onRefresh }: { onRefresh: () => void }) {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    // Real-time listener for approval requests
    const q = query(collection(fdb, "approval_requests"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as ApprovalRequest));
      setRequests(requestsData);
      setLoading(false);
    }, (error) => {
      console.error("Failed to listen to approval requests:", error);
      toast.error("Failed to load approval requests");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: ApprovalRequest) => {
    setProcessing(request.id);
    try {
      // 1. Update approval request status
      await updateDoc(doc(fdb, "approval_requests", request.uid), {
        status: "approved",
        approved_at: serverTimestamp(),
      });

      // 2. Create user profile
      await setDoc(doc(fdb, "user_profiles", request.uid), {
        user_id: request.uid,
        name: request.name,
        employee_id: request.employee_id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // 3. Create user role
      await setDoc(doc(fdb, "user_roles", request.uid), {
        user_id: request.uid,
        role: request.role,
        created_at: serverTimestamp(),
      });

      toast.success(`✅ Approved ${request.name} (${request.employee_id})`);
      onRefresh();
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("Failed to approve user");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    if (!confirm(`Are you sure you want to reject ${request.name}?`)) return;

    setProcessing(request.id);
    try {
      // Update approval request status to rejected
      await updateDoc(doc(fdb, "approval_requests", request.uid), {
        status: "rejected",
        rejected_at: serverTimestamp(),
      });

      toast.success(`❌ Rejected ${request.name}`);
      onRefresh();
    } catch (error) {
      console.error("Failed to reject user:", error);
      toast.error("Failed to reject user");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = async (request: ApprovalRequest) => {
    if (!confirm(`Permanently delete this request for ${request.name}?`)) return;

    setProcessing(request.id);
    try {
      await deleteDoc(doc(fdb, "approval_requests", request.uid));
      toast.success("Request deleted");
      onRefresh();
    } catch (error) {
      console.error("Failed to delete request:", error);
      toast.error("Failed to delete request");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Pending</p>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">{pendingRequests.length}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Approved</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{approvedRequests.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Rejected</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{rejectedRequests.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">⏳ Pending Approvals</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono text-sm">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "🛠️ Admin" : "🧑‍💼 Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {request.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          disabled={processing === request.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={processing === request.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approved Users */}
      {approvedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">✅ Approved Users</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Approved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedRequests.map((request) => (
                  <TableRow key={request.id} className="bg-green-50/50 dark:bg-green-950/10">
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono text-sm">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "🛠️ Admin" : "🧑‍💼 Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {request.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Rejected Users */}
      {rejectedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">❌ Rejected Requests</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rejectedRequests.map((request) => (
                  <TableRow key={request.id} className="bg-red-50/50 dark:bg-red-950/10">
                    <TableCell className="font-medium">{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono text-sm">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "🛠️ Admin" : "🧑‍💼 Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {request.created_at?.toDate?.()?.toLocaleDateString() || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRequest(request)}
                        disabled={processing === request.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No approval requests found</p>
        </div>
      )}
    </div>
  );
}
