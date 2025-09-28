import { useState } from "react";
import { Camera, Upload, Calendar, Weight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EcoButton } from "@/components/ui/eco-button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { WasteType, WasteEntry } from "@/types";

const wasteTypes: WasteType[] = [
  { id: 'plastic', name: 'Plastic', icon: '♻️', color: 'text-blue-500' },
  { id: 'paper', name: 'Paper', icon: '📄', color: 'text-orange-500' },
  { id: 'organic', name: 'Organic', icon: '🌱', color: 'text-green-500' },
  { id: 'metal', name: 'Metal', icon: '🔩', color: 'text-gray-500' },
  { id: 'glass', name: 'Glass', icon: '🫙', color: 'text-cyan-500' },
  { id: 'electronic', name: 'Electronic', icon: '💻', color: 'text-purple-500' },
];

interface WasteEntryFormProps {
  employeeId: string;
  onSubmit: (entry: Omit<WasteEntry, 'id' | 'employeeName' | 'status'>) => Promise<void>;
}

export default function WasteEntryForm({ employeeId, onSubmit }: WasteEntryFormProps) {
  const [wasteType, setWasteType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      toast({
        title: "Image captured",
        description: "Image ready for upload",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wasteType || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedWasteType = wasteTypes.find(w => w.id === wasteType);
    if (!selectedWasteType) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        employeeId,
        wasteType: selectedWasteType,
        amount: parseFloat(amount),
        dateTime: new Date().toISOString(),
        imageUrl: image ? URL.createObjectURL(image) : undefined,
      });
      
      setIsSubmitted(true);
      toast({
        title: "Waste Entry Submitted",
        description: "Your waste entry has been recorded successfully!",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setWasteType('');
        setAmount('');
        setImage(null);
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit waste entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-eco border-card-border text-center">
          <CardContent className="pt-6">
            <div className="mx-auto w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-success-foreground" />
            </div>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              Submission Successful!
            </h2>
            <p className="text-muted-foreground mb-4">
              Your waste entry has been recorded and will be reviewed by the admin.
            </p>
            <div className="text-sm text-muted-foreground">
              Redirecting to form in a few seconds...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 p-4">
      <div className="max-w-md mx-auto">
        <Card className="shadow-eco border-card-border">
          <CardHeader>
            <CardTitle className="text-xl font-display text-foreground">Submit Waste Entry</CardTitle>
            <CardDescription>Record your waste collection data</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wasteType" className="text-sm font-medium">Waste Type</Label>
                <Select value={wasteType} onValueChange={setWasteType} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select waste type" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{type.icon}</span>
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount (kg)</Label>
                <InputWithIcon
                  icon={<Weight className="w-4 h-4" />}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter weight in kg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="datetime" className="text-sm font-medium">Date & Time</Label>
                <InputWithIcon
                  icon={<Calendar className="w-4 h-4" />}
                  type="datetime-local"
                  value={new Date().toISOString().slice(0, 16)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Photo (Optional)</Label>
                <div className="flex gap-2">
                  <label htmlFor="camera" className="flex-1">
                    <EcoButton variant="outline" size="sm" type="button" className="w-full" asChild>
                      <div className="cursor-pointer">
                        <Camera className="w-4 h-4" />
                        Camera
                      </div>
                    </EcoButton>
                    <input
                      id="camera"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                  </label>
                  
                  <label htmlFor="gallery" className="flex-1">
                    <EcoButton variant="outline" size="sm" type="button" className="w-full" asChild>
                      <div className="cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Gallery
                      </div>
                    </EcoButton>
                    <input
                      id="gallery"
                      type="file"
                      accept="image/*"
                      onChange={handleImageCapture}
                      className="hidden"
                    />
                  </label>
                </div>
                {image && (
                  <p className="text-xs text-success">
                    ✓ Image selected: {image.name}
                  </p>
                )}
              </div>

              <EcoButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Entry"}
              </EcoButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}