import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  getFirestore,
  collection,
  updateDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  doc,
} from "firebase/firestore";

const fdb = getFirestore();

interface ApprovalRequest {
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
    // Real-time listener
    const q = query(collection(fdb, "approval_requests"), orderBy("created_at", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapped = snapshot.docs.map((d) => {
          return {
            uid: d.id, // doc ID is uid
            ...d.data(),
          } as ApprovalRequest;
        });

        setRequests(mapped);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load approval requests:", error);
        toast.error("Failed to load approval requests");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleApprove = async (request: ApprovalRequest) => {
    setProcessing(request.uid);

    try {
      // 1. Mark as approved
      await updateDoc(doc(fdb, "approval_requests", request.uid), {
        status: "approved",
        approved_at: serverTimestamp(),
      });

      // 2. Create profile
      await setDoc(doc(fdb, "user_profiles", request.uid), {
        user_id: request.uid,
        name: request.name,
        employee_id: request.employee_id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // 3. Create role
      await setDoc(doc(fdb, "user_roles", request.uid), {
        user_id: request.uid,
        role: request.role,
        created_at: serverTimestamp(),
      });

      toast.success(`Approved ${request.name} (${request.employee_id})`);
      onRefresh();
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error("Failed to approve user");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    if (!confirm(`Reject ${request.name}?`)) return;

    setProcessing(request.uid);

    try {
      await updateDoc(doc(fdb, "approval_requests", request.uid), {
        status: "rejected",
        rejected_at: serverTimestamp(),
      });

      toast.success(`Rejected ${request.name}`);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject user");
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = async (request: ApprovalRequest) => {
    if (!confirm(`Delete request for ${request.name}?`)) return;

    setProcessing(request.uid);

    try {
      await deleteDoc(doc(fdb, "approval_requests", request.uid));

      toast.success("Request deleted");
      onRefresh();
    } catch (err) {
      console.error(err);
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

  // Categorize requests
  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-700 dark:text-amber-400">Pending</p>
          <p className="text-2xl font-bold">{pending.length}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-700 dark:text-green-400">Approved</p>
          <p className="text-2xl font-bold">{approved.length}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-400">Rejected</p>
          <p className="text-2xl font-bold">{rejected.length}</p>
        </div>
      </div>

      {/* Pending Table */}
      {pending.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">⏳ Pending Approvals</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pending.map((request) => (
                  <TableRow key={request.uid}>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.created_at?.toDate?.()?.toLocaleDateString() ?? "N/A"}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          disabled={processing === request.uid}
                          onClick={() => handleApprove(request)}
                          className="bg-green-600 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processing === request.uid}
                          onClick={() => handleReject(request)}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Approved Table */}
      {approved.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">✅ Approved Users</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Approved</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {approved.map((request) => (
                  <TableRow key={request.uid}>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.created_at?.toDate?.()?.toLocaleDateString() ?? "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Rejected Table */}
      {rejected.length > 0 && (
        <>
          <h3 className="text-lg font-semibold">❌ Rejected Requests</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rejected.map((request) => (
                  <TableRow key={request.uid}>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell className="font-mono">{request.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant={request.role === "admin" ? "default" : "secondary"}>
                        {request.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.created_at?.toDate?.()?.toLocaleDateString() ?? "N/A"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={processing === request.uid}
                        onClick={() => handleDeleteRequest(request)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
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
