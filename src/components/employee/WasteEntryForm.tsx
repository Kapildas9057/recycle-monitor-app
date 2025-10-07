import { useState, useEffect } from "react";
import { Camera, Upload, Calendar, Weight, CheckCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EcoButton } from "@/components/ui/eco-button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { WasteType, WasteEntry } from "@/types";

const wasteTypes: WasteType[] = [
  { id: 'wet', name: 'ஈரமான', icon: '💧', color: 'text-green-500' },
  { id: 'dry', name: 'உலர்ந்த', icon: '♻️', color: 'text-blue-500' },
  { id: 'sanitary', name: 'சுகாதாரம்', icon: '🧻', color: 'text-pink-500' },
  { id: 'mixed', name: 'கலப்பு', icon: '🗑️', color: 'text-gray-500' },
];

interface WasteEntryFormProps {
  employeeId: string;
  onSubmit: (entry: Omit<WasteEntry, 'id' | 'employeeName' | 'status'>) => Promise<void>;
}

export default function WasteEntryForm({ employeeId, onSubmit }: WasteEntryFormProps) {
  const [wasteType, setWasteType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "இடம் கிடைக்கவில்லை",
        description: "உங்கள் சாதனம் இடம் கண்டறிதலை ஆதரிக்கவில்லை",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIsGettingLocation(false);
        toast({
          title: "இடம் கண்டறியப்பட்டது",
          description: "உங்கள் தற்போதைய இடம் பதிவு செய்யப்பட்டது",
        });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          title: "இடம் கண்டறிதல் பிழை",
          description: "உங்கள் இடத்தைப் பெற முடியவில்லை. அனுமதிகளைச் சரிபார்க்கவும்",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      toast({
        title: "புகைப்படம் எடுக்கப்பட்டது",
        description: "புகைப்படம் பதிவேற்றத்திற்கு தயார்",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wasteType || !amount) {
      toast({
        title: "தகவல் இல்லை",
        description: "தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்",
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
        location: location || undefined,
        imageUrl: image ? URL.createObjectURL(image) : undefined,
      });
      
      setIsSubmitted(true);
      toast({
        title: "கழிவு பதிவு சமர்ப்பிக்கப்பட்டது",
        description: "உங்கள் கழிவு பதிவு வெற்றிகரமாக பதிவு செய்யப்பட்டது!",
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setWasteType('');
        setAmount('');
        setImage(null);
        getCurrentLocation(); // Get location again for next entry
      }, 3000);
      
    } catch (error) {
      toast({
        title: "சமர்ப்பிப்பு தோல்வி",
        description: "கழிவு பதிவை சமர்ப்பிக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
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
              சமர்ப்பிப்பு வெற்றிகரம்!
            </h2>
            <p className="text-muted-foreground mb-4">
              உங்கள் கழிவு பதிவு பதிவு செய்யப்பட்டு நிர்வாகி மூலம் மதிப்பீடு செய்யப்படும்.
            </p>
            <div className="text-sm text-muted-foreground">
              சில வினாடிகளில் படிவத்திற்கு திருப்பி அனுப்பப்படும்...
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
            <CardTitle className="text-xl font-display text-foreground">கழிவு பதிவு சமர்ப்பிக்கவும்</CardTitle>
            <CardDescription>உங்கள் கழிவு சேகரிப்பு தரவைப் பதிவு செய்யவும்</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wasteType" className="text-sm font-medium">கழிவு வகை</Label>
                <Select value={wasteType} onValueChange={setWasteType} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="கழிவு வகையைத் தேர்ந்தெடுக்கவும்" />
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
                <Label htmlFor="amount" className="text-sm font-medium">எடை (கி.கி)</Label>
                <InputWithIcon
                  icon={<Weight className="w-4 h-4" />}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="கிலோகிராமில் எடையை உள்ளிடவும்"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="datetime" className="text-sm font-medium">தேதி மற்றும் நேரம்</Label>
                <InputWithIcon
                  icon={<Calendar className="w-4 h-4" />}
                  type="datetime-local"
                  value={new Date().toISOString().slice(0, 16)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">இடம்</Label>
                <div className="flex gap-2">
                  <InputWithIcon
                    icon={<MapPin className="w-4 h-4" />}
                    type="text"
                    placeholder="இடம் கண்டறியப்படுகிறது..."
                    value={location}
                    disabled
                    className="flex-1"
                  />
                  <EcoButton 
                    variant="outline" 
                    size="sm" 
                    type="button" 
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? "..." : "📍"}
                  </EcoButton>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">புகைப்படம் (விருப்பமானது)</Label>
                <div className="flex gap-2">
                  <label htmlFor="camera" className="flex-1">
                    <EcoButton variant="outline" size="sm" type="button" className="w-full" asChild>
                      <div className="cursor-pointer">
                        <Camera className="w-4 h-4" />
                        கேமரா
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
                        கேலரி
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
                    ✓ புகைப்படம் தேர்ந்தெடுக்கப்பட்டது: {image.name}
                  </p>
                )}
              </div>

              <EcoButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "சமர்ப்பிக்கப்படுகிறது..." : "பதிவு சமர்ப்பிக்கவும்"}
              </EcoButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}