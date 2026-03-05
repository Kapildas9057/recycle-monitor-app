import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EcoButton } from "@/components/ui/eco-button";
import { AlertTriangle, CheckCircle2, Leaf, Upload, Send } from "lucide-react";
import { db, storage } from "@/integrations/firebase/client";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "@/components/ui/use-toast";

const COMPLAINT_CATEGORIES = [
  { value: "garbage", label: "Garbage" },
  { value: "overflowing_bin", label: "Overflowing Bin" },
  { value: "missed_pickup", label: "Missed Pickup" },
  { value: "other", label: "Other" },
] as const;

interface ComplaintFormData {
  wardNumber: string;
  category: string;
  description: string;
  location: string;
  submittedBy: string;
  phone: string;
}

export default function ComplaintForm() {
  const [form, setForm] = useState<Partial<ComplaintFormData>>({});
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ComplaintFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.submittedBy?.trim()) newErrors.submittedBy = "Name is required";
    if (!form.phone?.trim() || (form.phone.trim().length < 10)) newErrors.phone = "Valid phone number required";
    if (!form.location?.trim()) newErrors.location = "Address/location is required";
    if (!form.wardNumber?.trim()) newErrors.wardNumber = "Ward number is required";
    if (!form.category) newErrors.category = "Select a complaint category";
    if (!form.description?.trim() || form.description.trim().length < 10) newErrors.description = "Describe the issue (min 10 chars)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Upload image to Firebase Storage if provided
      let imageUrl: string | null = null;
      if (image) {
        const imageRef = ref(storage, `complaint_images/${Date.now()}_${image.name}`);
        const snap = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, "ward_complaints"), {
        wardNumber: form.wardNumber!.trim(),
        category: form.category!,
        description: form.description!.trim(),
        imageUrl,
        location: form.location!.trim(),
        submittedBy: form.submittedBy!.trim(),
        phone: form.phone!.trim(),
        createdAt: serverTimestamp(),
        status: "Pending",
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
                    <Label htmlFor="submittedBy">Full Name *</Label>
                    <Input id="submittedBy" value={form.submittedBy || ""} onChange={e => handleChange("submittedBy", e.target.value)} placeholder="Your full name" />
                    {errors.submittedBy && <p className="text-xs text-destructive">{errors.submittedBy}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" value={form.phone || ""} onChange={e => handleChange("phone", e.target.value)} placeholder="Phone number" />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Address / Location *</Label>
                  <Input id="location" value={form.location || ""} onChange={e => handleChange("location", e.target.value)} placeholder="Full address or location" />
                  {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wardNumber">Ward Number *</Label>
                  <Input id="wardNumber" value={form.wardNumber || ""} onChange={e => handleChange("wardNumber", e.target.value)} placeholder="e.g. 12" />
                  {errors.wardNumber && <p className="text-xs text-destructive">{errors.wardNumber}</p>}
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Complaint Details</h3>

                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.category || ""} onValueChange={v => handleChange("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLAINT_CATEGORIES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
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
