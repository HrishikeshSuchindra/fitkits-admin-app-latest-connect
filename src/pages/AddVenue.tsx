import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Image, DollarSign, Eye, ArrowLeft, ArrowRight, Upload, X, Check, Clock, MapPin, Star, Wifi, Car, Coffee, Music, Users, Tv } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Basic", icon: FileText },
  { id: 2, label: "Media", icon: Image },
  { id: 3, label: "Pricing", icon: DollarSign },
  { id: 4, label: "Review", icon: Eye },
];

const categories = [
  "Photography Studio",
  "Event Space",
  "Meeting Room",
  "Outdoor Venue",
  "Recording Studio",
  "Coworking Space",
];

const amenities = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "coffee", label: "Coffee", icon: Coffee },
  { id: "sound", label: "Sound System", icon: Music },
  { id: "capacity", label: "Large Capacity", icon: Users },
  { id: "av", label: "AV Equipment", icon: Tv },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const durationOptions = ["30 min", "1 hour", "2 hours", "4 hours", "Custom"];

export default function AddVenue() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    photos: [] as string[],
    selectedAmenities: [] as string[],
    schedule: daysOfWeek.map((day) => ({
      day,
      enabled: day !== "Sunday",
      open: "09:00",
      close: "18:00",
    })),
    minDuration: "1 hour",
    pricePerHour: "",
    peakPrice: "",
  });

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
    else navigate("/venues");
  };

  const handleAmenityToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(id)
        ? prev.selectedAmenities.filter((a) => a !== id)
        : [...prev.selectedAmenities, id],
    }));
  };

  const handleScheduleToggle = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s, i) =>
        i === index ? { ...s, enabled: !s.enabled } : s
      ),
    }));
  };

  const handlePublish = () => {
    console.log("Publishing venue:", formData);
    navigate("/venues");
  };

  return (
    <div className="mobile-container pb-6">
      <MobileHeader
        title="Add New Venue"
        showBack
        onBackClick={handleBack}
        showNotification={false}
        rightContent={
          <button className="text-sm text-primary font-medium">Save</button>
        }
      />

      <div className="mobile-padding py-4">
        <StepIndicator steps={steps} currentStep={currentStep} className="mb-8" />

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <Label htmlFor="name">Venue Name *</Label>
              <Input
                id="name"
                placeholder="Enter venue name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Category *</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={cn(
                      "p-3 rounded-xl text-sm font-medium border transition-all",
                      formData.category === cat
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your venue..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {formData.description.length}/500
              </p>
            </div>

            <div className="space-y-3">
              <Label>Location</Label>
              <div className="card-elevated p-4 flex items-center justify-center h-32 border-2 border-dashed border-border">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Select on map</p>
                </div>
              </div>
              
              <Input
                placeholder="Street Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  placeholder="Postal Code"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              
              <Input
                placeholder="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Facilities & Media */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label>Photos</Label>
              <div className="mt-2 space-y-3">
                {/* Cover Photo Upload */}
                <div className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">Upload Cover Photo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                </div>

                {/* Additional Photos Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Maximum 10 photos</p>
              </div>
            </div>

            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {amenities.map((amenity) => {
                  const isSelected = formData.selectedAmenities.includes(amenity.id);
                  const Icon = amenity.icon;
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 transition-all",
                        isSelected
                          ? "border-primary bg-primary-light"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "icon-container-sm",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {amenity.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Availability & Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Opening Hours</Label>
                <button className="text-sm text-primary font-medium">Copy to All</button>
              </div>
              <div className="space-y-2">
                {formData.schedule.map((day, index) => (
                  <div
                    key={day.day}
                    className={cn(
                      "card-elevated p-3 flex items-center justify-between",
                      !day.enabled && "opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={() => handleScheduleToggle(index)}
                      />
                      <span className="text-sm font-medium w-24">{day.day.slice(0, 3)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={day.open}
                        disabled={!day.enabled}
                        className="w-24 h-8 text-xs"
                        onChange={(e) => {
                          const newSchedule = [...formData.schedule];
                          newSchedule[index].open = e.target.value;
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        type="time"
                        value={day.close}
                        disabled={!day.enabled}
                        className="w-24 h-8 text-xs"
                        onChange={(e) => {
                          const newSchedule = [...formData.schedule];
                          newSchedule[index].close = e.target.value;
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Minimum Booking Duration</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setFormData({ ...formData, minDuration: duration })}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                      formData.minDuration === duration
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price per Hour ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="85"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="peakPrice">Peak Price ($)</Label>
                <Input
                  id="peakPrice"
                  type="number"
                  placeholder="120"
                  value={formData.peakPrice}
                  onChange={(e) => setFormData({ ...formData, peakPrice: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="card-elevated p-4 bg-primary-light/50 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="icon-container-sm bg-primary/20">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Pricing Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard rate: ${formData.pricePerHour || "85"}/hr • Peak hours (6-9PM): ${formData.peakPrice || "120"}/hr
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            {/* Image Preview */}
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop"
                alt="Venue preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Venue Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {formData.name || "Creative Studio Downtown"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formData.category || "Photography Studio"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="font-semibold">New</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{formData.city || "Downtown"}, {formData.country || "NYC"}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-success">
                  ${formData.pricePerHour || "85"}
                </span>
                <span className="text-muted-foreground">/hour</span>
              </div>
            </div>

            {/* Amenities Grid */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {(formData.selectedAmenities.length > 0 ? formData.selectedAmenities : ["wifi", "parking", "coffee"]).map((id) => {
                  const amenity = amenities.find((a) => a.id === id);
                  if (!amenity) return null;
                  const Icon = amenity.icon;
                  return (
                    <div key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* About */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">About</h3>
              <p className="text-sm text-muted-foreground">
                {formData.description || "A beautiful creative space perfect for photography shoots, small events, and creative workshops. Natural lighting throughout the day with professional equipment available."}
              </p>
            </div>

            {/* Availability Slots Preview */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Available Times</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"].map((time) => (
                  <button
                    key={time}
                    className="flex-shrink-0 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-primary transition-colors"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews Preview */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Reviews</h3>
              <div className="card-elevated p-4">
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Reviews will appear here once your venue is published
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext} className="flex-1">
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handlePublish} className="flex-1 bg-success hover:bg-success/90">
              <Check className="w-4 h-4 mr-2" />
              Publish Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
