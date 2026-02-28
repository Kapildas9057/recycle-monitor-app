import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EcoButton } from "@/components/ui/eco-button";
import { AlertTriangle, CheckCircle2, Leaf, Upload, Send } from "lucide-react";
import { complaintSchema, complaintTypes, type ComplaintInput } from "@/types/complaint";
import { db } from "@/integrations/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";
export default function ComplaintForm() {
  const [form, setForm] = useState<Partial<ComplaintInput>>({});
  const [_image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ComplaintInput, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation for UX only — server validates independently
    const result = complaintSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "complaints"), {
        fullName: result.data.fullName,
        phone: result.data.phone,
        address: result.data.address,
        zone: result.data.zone,
        wardNumber: result.data.wardNumber,
        complaintType: result.data.complaintType,
        description: result.data.description,
        issueDate: serverTimestamp(),
        imageUrl: null,
        status: "open",
        assignedEmployeeId: null,
        createdAt: serverTimestamp(),
        resolvedAt: null,
      });

      setIsSubmitted(true);
      toast.success("Complaint submitted successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit complaint";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-lg border-primary/20">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Complaint Registered</h2>
            <p className="text-muted-foreground text-sm">
              Your complaint has been submitted and will be reviewed by our team. Thank you for helping us improve.
            </p>
            <EcoButton onClick={() => { setIsSubmitted(false); setForm({}); setImage(null); }}>
              Submit Another Complaint
            </EcoButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Leaf className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">EcoShift</h1>
          </div>
          <p className="text-muted-foreground">Customer Complaint Portal</p>
        </div>

        <Card className="shadow-lg border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report an Issue
            </CardTitle>
            <CardDescription>
              Help us improve waste management in your area. All fields marked are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" value={form.fullName || ""} onChange={e => handleChange("fullName", e.target.value)} placeholder="Your full name" />
                    {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" value={form.phone || ""} onChange={e => handleChange("phone", e.target.value)} placeholder="Phone number" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" value={form.address || ""} onChange={e => handleChange("address", e.target.value)} placeholder="Full address" />
                  {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="zone">Zone *</Label>
                    <Input id="zone" value={form.zone || ""} onChange={e => handleChange("zone", e.target.value)} placeholder="e.g. Zone A" />
                    {errors.zone && <p className="text-xs text-destructive">{errors.zone}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wardNumber">Ward Number *</Label>
                    <Input id="wardNumber" value={form.wardNumber || ""} onChange={e => handleChange("wardNumber", e.target.value)} placeholder="e.g. 12" />
                    {errors.wardNumber && <p className="text-xs text-destructive">{errors.wardNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Complaint Details</h3>

                <div className="space-y-1.5">
                  <Label>Complaint Type *</Label>
                  <Select value={form.complaintType || ""} onValueChange={v => handleChange("complaintType", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {complaintTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.complaintType && <p className="text-xs text-destructive">{errors.complaintType}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description || ""}
                    onChange={e => handleChange("description", e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={4}
                  />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <Label>Attach Photo (optional)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      id="complaint-image"
                      onChange={e => setImage(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="complaint-image" className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">{image ? image.name : "Tap to upload or take photo"}</span>
                    </label>
                  </div>
                </div>
              </div>

              <EcoButton type="submit" className="w-full" disabled={isSubmitting}>
                <Send className="w-4 h-4" />
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </EcoButton>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          EcoShift Waste Management &mdash; Improving your community
        </p>
      </div>
    </div>
  );
}
