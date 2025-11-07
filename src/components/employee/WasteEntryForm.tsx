import { useState, useEffect } from "react";
import { Camera, Upload, Calendar, Weight, CheckCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EcoButton } from "@/components/ui/eco-button";
import { InputWithIcon } from "@/components/ui/input-with-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useTamilText } from "@/hooks/useTamilText";
import type { WasteType, WasteEntry } from "@/types";

const wasteTypes: WasteType[] = [
  { id: 'wet', name: 'Wet Waste / ஈரமான', icon: '💧', color: 'text-green-500' },
  { id: 'dry', name: 'Dry Waste / உலர்ந்த', icon: '♻️', color: 'text-blue-500' },
  { id: 'mixed', name: 'Mixed Waste / கலப்பு', icon: '🗑️', color: 'text-gray-500' },
  { id: 'sanitary', name: 'Sanitary Waste / சுகாதாரம்', icon: '🧻', color: 'text-pink-500' },
];

interface WasteEntryFormProps {
  employeeId: string;
  onSubmit: (entry: Omit<WasteEntry, 'id' | 'employeeName' | 'status'>, imageFile?: File) => Promise<void>;
}

export default function WasteEntryForm({ employeeId, onSubmit }: WasteEntryFormProps) {
  const t = useTamilText();
  const [wasteType, setWasteType] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [image, setImage] = useState<File | null>(null);
  const [location, setLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const CACHE_KEY = `waste-entry-${employeeId}`;

  // Load cached data and get current location on component mount
  useEffect(() => {
    // Load cached form data
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { wasteType: cachedType, amount: cachedAmount } = JSON.parse(cached);
        if (cachedType) setWasteType(cachedType);
        if (cachedAmount) setAmount(cachedAmount);
      } catch (e) {
        console.error('Failed to load cached data', e);
      }
    }
    getCurrentLocation();
  }, []);

  // Cache form data whenever it changes
  useEffect(() => {
    if (wasteType || amount) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ wasteType, amount }));
    }
  }, [wasteType, amount]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error(t("location_error"), { description: t("please_enable_location") });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setIsGettingLocation(false);
        toast(t("location"), { description: t("getting_location") });
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error(t("location_error"), { description: t("please_enable_location") });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      toast(t("upload_image"), { description: t("upload_image") });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wasteType || !amount) {
      toast.error(t("fill_all_fields"), { description: t("fill_all_fields") });
      return;
    }

    const selectedWasteType = wasteTypes.find(w => w.id === wasteType);
    if (!selectedWasteType) return;

    setIsSubmitting(true);
    
    try {
      await onSubmit(
        {
          employeeId,
          wasteType: selectedWasteType.name,
          amount: parseFloat(amount),
          dateTime: new Date().toISOString(),
          location: location || undefined,
        },
        image || undefined
      );
      
      setIsSubmitted(true);
      toast(t("submitted_successfully"), { description: t("entry_saved") });
      
      // Clear cache on successful submission
      localStorage.removeItem(CACHE_KEY);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setWasteType('');
        setAmount('');
        setImage(null);
        getCurrentLocation(); // Get location again for next entry
      }, 3000);
      
    } catch (error) {
      toast.error(t("failed_to_submit"), { description: t("error_saving") });
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
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t("submitted_successfully")}
            </h2>
            <p className="text-muted-foreground mb-4" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t("entry_saved")}
            </p>
            <div className="text-sm text-muted-foreground" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t("loading")}
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
            <CardTitle className="text-xl font-display text-foreground" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t("waste_entry_form")}
            </CardTitle>
            <CardDescription style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
              {t("my_waste_logs")}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wasteType" className="text-sm font-medium" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t("waste_type")}
                </Label>
                <Select value={wasteType} onValueChange={setWasteType} required>
                  <SelectTrigger className="h-12" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    <SelectValue placeholder={t("select_waste_type")} />
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
                <Label htmlFor="amount" className="text-sm font-medium" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t("amount_kg")}
                </Label>
                <InputWithIcon
                  icon={<Weight className="w-4 h-4" />}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={t("enter_amount")}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="datetime" className="text-sm font-medium" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t("date_time")}
                </Label>
                <InputWithIcon
                  icon={<Calendar className="w-4 h-4" />}
                  type="datetime-local"
                  value={new Date().toISOString().slice(0, 16)}
                  disabled
                  style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t("location")}
                </Label>
                <div className="flex gap-2">
                  <InputWithIcon
                    icon={<MapPin className="w-4 h-4" />}
                    type="text"
                    placeholder={t("getting_location")}
                    value={location}
                    disabled
                    className="flex-1"
                    style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
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
                <Label className="text-sm font-medium" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                  {t("capture_waste_photo")}
                </Label>
                <div className="flex gap-2">
                  <label htmlFor="camera" className="flex-1">
                    <EcoButton variant="outline" size="sm" type="button" className="w-full" asChild>
                      <div className="cursor-pointer" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                        <Camera className="w-4 h-4" />
                        {t("take_photo")}
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
                      <div className="cursor-pointer" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                        <Upload className="w-4 h-4" />
                        {t("choose_from_gallery")}
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
                  <p className="text-xs text-success" style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}>
                    ✓ {t("upload_image")}: {image.name}
                  </p>
                )}
              </div>

              <EcoButton
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
                style={{ fontFamily: "'Noto Sans Tamil', sans-serif" }}
              >
                {isSubmitting ? t("submitting") : t("submit_entry")}
              </EcoButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}