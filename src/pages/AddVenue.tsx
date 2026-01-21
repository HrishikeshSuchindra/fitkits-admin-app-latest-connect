import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Image, DollarSign, Eye, Upload, X, Check, Clock, MapPin, Star, Wifi, Car, Shirt, Wind, Dumbbell, MoreHorizontal, Camera, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { MobileHeader } from "@/components/ui/MobileHeader";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { edgeFunctionApi } from "@/lib/edgeFunctionApi";
import { uploadVenuePhoto, uploadMultipleVenuePhotos } from "@/lib/uploadVenuePhoto";
import { toast } from "sonner";

const steps = [
  { id: 1, label: "Basic", icon: FileText },
  { id: 2, label: "Media", icon: Image },
  { id: 3, label: "Pricing", icon: DollarSign },
  { id: 4, label: "Review", icon: Eye },
];

const mainCategories = [
  { value: "courts", label: "Courts" },
  { value: "studio", label: "Studio" },
  { value: "recovery", label: "Recovery" },
];

const typesByCategory: Record<string, { value: string; label: string }[]> = {
  courts: [
    { value: "padel", label: "Padel" },
    { value: "tennis", label: "Tennis" },
    { value: "badminton", label: "Badminton" },
    { value: "pickleball", label: "Pickleball" },
    { value: "squash", label: "Squash" },
    { value: "basketball", label: "Basketball" },
    { value: "volleyball", label: "Volleyball" },
    { value: "multi-sport", label: "Multi-sport" },
  ],
  studio: [
    { value: "yoga", label: "Yoga" },
    { value: "pilates", label: "Pilates" },
    { value: "dance", label: "Dance" },
    { value: "martial-arts", label: "Martial Arts" },
    { value: "crossfit", label: "CrossFit" },
    { value: "spinning", label: "Spinning" },
    { value: "fitness", label: "Fitness" },
  ],
  recovery: [
    { value: "spa", label: "Spa" },
    { value: "massage", label: "Massage" },
    { value: "physiotherapy", label: "Physiotherapy" },
    { value: "cryotherapy", label: "Cryotherapy" },
    { value: "sauna", label: "Sauna" },
    { value: "float-tank", label: "Float Tank" },
  ],
};

const amenities = [
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: Car },
  { id: "changing_rooms", label: "Changing Rooms", icon: Shirt },
  { id: "air_con", label: "Air Con", icon: Wind },
  { id: "equipment", label: "Equipment", icon: Dumbbell },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const daysOfWeek = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

const durationOptions = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "Custom", value: 0 },
];

const countries = [
  { value: "india", label: "India" },
  { value: "usa", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "uae", label: "UAE" },
  { value: "australia", label: "Australia" },
  { value: "singapore", label: "Singapore" },
];

export default function AddVenue() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const additionalPhotosRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    name: "",
    category: "", // Main category: courts, studio, recovery
    type: "", // Sub-type: padel, tennis, yoga, etc.
    courtsCount: 1, // Number of courts (only for courts category)
    description: "",
    
    // Location
    streetAddress: "",
    city: "",
    postalCode: "",
    country: "",
    
    // Media
    coverPhoto: null as File | null,
    coverPhotoPreview: "",
    additionalPhotos: [] as File[],
    additionalPhotosPreviews: [] as string[],
    selectedAmenities: [] as string[],
    customAmenities: [] as string[], // Custom amenities typed by user
    newCustomAmenity: "", // Input field for typing new custom amenity
    
    // Pricing & Availability
    schedule: daysOfWeek.map((day, index) => ({
      day: day.short,
      fullDay: day.full,
      enabled: index < 5, // Mon-Fri enabled by default
      open: "09:00",
      close: "17:00",
    })),
    minDuration: 60, // Default 1 hour in minutes
    pricePerHour: "",
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

  // Helper to format amenity text properly (Title Case)
  const formatAmenityText = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddCustomAmenity = () => {
    const trimmed = formData.newCustomAmenity.trim();
    const formatted = formatAmenityText(trimmed);
    if (formatted && !formData.customAmenities.includes(formatted)) {
      setFormData((prev) => ({
        ...prev,
        customAmenities: [...prev.customAmenities, formatted],
        newCustomAmenity: "",
      }));
    }
  };

  const handleRemoveCustomAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      customAmenities: prev.customAmenities.filter((a) => a !== amenity),
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

  const handleScheduleTimeChange = (index: number, field: 'open' | 'close', value: string) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleCopyToAll = () => {
    const firstEnabled = formData.schedule.find(s => s.enabled);
    if (!firstEnabled) return;
    
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.map((s) => ({
        ...s,
        open: firstEnabled.open,
        close: firstEnabled.close,
      })),
    }));
    toast.success("Copied schedule to all days");
  };

  const handleCoverPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverPhoto: file,
        coverPhotoPreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleAdditionalPhotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxPhotos = 9; // Max 9 additional photos (10 total with cover)
    const remainingSlots = maxPhotos - formData.additionalPhotos.length;
    const newFiles = files.slice(0, remainingSlots);
    
    if (newFiles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        additionalPhotos: [...prev.additionalPhotos, ...newFiles],
        additionalPhotosPreviews: [
          ...prev.additionalPhotosPreviews,
          ...newFiles.map((f) => URL.createObjectURL(f)),
        ],
      }));
    }
  };

  const handleRemoveCoverPhoto = () => {
    setFormData((prev) => ({
      ...prev,
      coverPhoto: null,
      coverPhotoPreview: "",
    }));
  };

  const handleRemoveAdditionalPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      additionalPhotos: prev.additionalPhotos.filter((_, i) => i !== index),
      additionalPhotosPreviews: prev.additionalPhotosPreviews.filter((_, i) => i !== index),
    }));
  };

  const handlePublish = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Venue name is required");
      setCurrentStep(1);
      return;
    }
    if (!formData.category) {
      toast.error("Category is required");
      setCurrentStep(1);
      return;
    }
    if (!formData.streetAddress.trim() || !formData.city.trim()) {
      toast.error("Address and city are required");
      setCurrentStep(1);
      return;
    }
    if (!formData.pricePerHour) {
      toast.error("Price per hour is required");
      setCurrentStep(3);
      return;
    }

    setIsPublishing(true);

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      let coverPhotoUrl = "";
      const photoUrls: string[] = [];

      // Upload cover photo
      if (formData.coverPhoto) {
        try {
          coverPhotoUrl = await uploadVenuePhoto(formData.coverPhoto, slug, 0);
        } catch (uploadError) {
          console.warn('Cover photo upload failed, continuing without it:', uploadError);
        }
      }

      // Upload additional photos
      if (formData.additionalPhotos.length > 0) {
        try {
          const uploadedUrls = await uploadMultipleVenuePhotos(
            formData.additionalPhotos,
            slug,
            1
          );
          photoUrls.push(...uploadedUrls);
        } catch (uploadError) {
          console.warn('Additional photos upload failed, continuing without them:', uploadError);
        }
      }

      // Build opening hours JSONB
      const openingHours = formData.schedule.reduce((acc, day) => {
        acc[day.day] = {
          enabled: day.enabled,
          open: day.open,
          close: day.close,
        };
        return acc;
      }, {} as Record<string, { enabled: boolean; open: string; close: string }>);

      // Combine standard and custom amenities (exclude "other" placeholder, add actual custom ones)
      const allAmenities = [
        ...formData.selectedAmenities.filter(a => a !== 'other'),
        ...formData.customAmenities,
      ];

      // Create venue
      const venueData = {
        name: formData.name,
        slug,
        category: formData.category,
        sport: formData.type,
        address: formData.streetAddress,
        location: formData.city,
        price_per_hour: parseFloat(formData.pricePerHour),
        image_url: coverPhotoUrl || null,
        gallery_urls: photoUrls,
        amenities: allAmenities,
        description: formData.description,
        opening_hours: openingHours,
        min_booking_duration: formData.minDuration,
        courts_count: formData.category === "courts" ? formData.courtsCount : 1,
        is_active: true,
      };

      await edgeFunctionApi.createVenue(venueData);

      toast.success("Venue published successfully!");
      navigate("/venues");
    } catch (error: any) {
      console.error('Publish error:', error);
      toast.error(error.message || "Failed to publish venue");
    } finally {
      setIsPublishing(false);
    }
  };

  // Get all preview images for the carousel
  const allPreviewImages = [
    formData.coverPhotoPreview,
    ...formData.additionalPhotosPreviews,
  ].filter(Boolean);

  const canGoToPrevImage = previewImageIndex > 0;
  const canGoToNextImage = previewImageIndex < allPreviewImages.length - 1;

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
                placeholder="e.g., Downtown Tennis Club"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value, type: "" })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                disabled={!formData.category}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={formData.category ? "Select type" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {(typesByCategory[formData.category] || []).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Number of Courts - only show for courts category */}
            {formData.category === "courts" && (
              <div>
                <Label htmlFor="courtsCount">Number of Courts *</Label>
                <Input
                  id="courtsCount"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g., 3"
                  value={formData.courtsCount}
                  onChange={(e) => setFormData({ ...formData, courtsCount: parseInt(e.target.value) || 1 })}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How many courts are available for booking at this venue?
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your venue, its features, and what makes it special..."
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
              
              {/* Map placeholder */}
              <div className="card-elevated p-4 flex items-center justify-center h-32 border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Tap to select location</p>
                </div>
              </div>
              
              <Input
                placeholder="Street Address"
                value={formData.streetAddress}
                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
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
              
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Facilities & Media */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label>Photos</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Add photos of your venue. The first photo will be your cover image.
              </p>
              
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={coverPhotoRef}
                accept="image/*"
                className="hidden"
                onChange={handleCoverPhotoSelect}
              />
              <input
                type="file"
                ref={additionalPhotosRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAdditionalPhotosSelect}
              />

              <div className="space-y-3">
                {/* Cover Photo Upload */}
                {formData.coverPhotoPreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden">
                    <img
                      src={formData.coverPhotoPreview}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleRemoveCoverPhoto}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded-md text-xs text-white">
                      Cover Photo
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => coverPhotoRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-foreground">Upload Cover Photo</p>
                    <p className="text-xs text-muted-foreground">This will be your main listing image</p>
                  </button>
                )}

                {/* Additional Photos Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {formData.additionalPhotosPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt={`Photo ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveAdditionalPhoto(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {formData.additionalPhotosPreviews.length < 9 && (
                    <button
                      onClick={() => additionalPhotosRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/50 flex items-center justify-center hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Drag & drop photos or tap to browse. Max 10 photos.
                </p>
              </div>
            </div>

            <div>
              <Label>Amenities</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Select the amenities available at your venue.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((amenity) => {
                  const isSelected = formData.selectedAmenities.includes(amenity.id);
                  const Icon = amenity.icon;
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 transition-all text-left",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                      <div className={cn(
                        "icon-container-sm",
                        isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {amenity.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amenities Input - shown when "Other" is selected */}
              {formData.selectedAmenities.includes("other") && (
                <div className="mt-4 space-y-3">
                  <Label className="text-sm">Add Custom Amenities</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Sauna, Juice Bar, Pro Shop..."
                      value={formData.newCustomAmenity}
                      onChange={(e) => setFormData({ ...formData, newCustomAmenity: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomAmenity();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCustomAmenity}
                      disabled={!formData.newCustomAmenity.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Display custom amenities as removable chips */}
                  {formData.customAmenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.customAmenities.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          <span>{amenity}</span>
                          <button
                            onClick={() => handleRemoveCustomAmenity(amenity)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Availability & Pricing */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Opening Hours</Label>
                <button
                  onClick={handleCopyToAll}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Copy to All
                </button>
              </div>
              <div className="space-y-2">
                {formData.schedule.map((day, index) => (
                  <div
                    key={day.day}
                    className={cn(
                      "card-elevated p-3",
                      !day.enabled && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={day.enabled}
                          onCheckedChange={() => handleScheduleToggle(index)}
                        />
                        <span className="text-sm font-medium">{day.day}</span>
                      </div>
                    </div>
                    {day.enabled && (
                      <div className="flex items-center gap-2 ml-11">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="time"
                            value={day.open}
                            className="w-24 h-8 text-xs"
                            onChange={(e) => handleScheduleTimeChange(index, 'open', e.target.value)}
                          />
                        </div>
                        <span className="text-muted-foreground">-</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="time"
                            value={day.close}
                            className="w-24 h-8 text-xs"
                            onChange={(e) => handleScheduleTimeChange(index, 'close', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Minimum Booking Duration</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {durationOptions.map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => setFormData({ ...formData, minDuration: duration.value })}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                      formData.minDuration === duration.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/50"
                    )}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price per Hour (₹) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="e.g., 500"
                value={formData.pricePerHour}
                onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div className="card-elevated p-4 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="icon-container-sm bg-primary/20">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Pricing Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Standard rate: ₹{formData.pricePerHour || "0"}/hr
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fade-in">
            {/* Image Preview with Carousel */}
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
              {allPreviewImages.length > 0 ? (
                <>
                  <img
                    src={allPreviewImages[previewImageIndex]}
                    alt="Venue preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image counter */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded-md text-xs text-white">
                    {previewImageIndex + 1} of {allPreviewImages.length}
                  </div>
                  
                  {/* Favorite button */}
                  <button className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  
                  {/* Navigation arrows */}
                  {canGoToPrevImage && (
                    <button
                      onClick={() => setPreviewImageIndex((prev) => prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {canGoToNextImage && (
                    <button
                      onClick={() => setPreviewImageIndex((prev) => prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Camera className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Venue Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {formData.name || "Venue Name"}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">
                    {formData.category || "Category"}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                  <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                  <span className="text-xs font-medium text-primary">New</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {formData.city || "City"}
                  {formData.country && `, ${countries.find(c => c.value === formData.country)?.label || formData.country}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-success">
                  ₹{formData.pricePerHour || "0"}
                </span>
                <span className="text-muted-foreground">/hour</span>
              </div>
            </div>

            {/* What this place offers */}
            {(formData.selectedAmenities.length > 0 || formData.customAmenities.length > 0) && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">What this place offers</h3>
                <div className="grid grid-cols-2 gap-2">
                  {/* Standard amenities (exclude "other" placeholder) */}
                  {formData.selectedAmenities
                    .filter(id => id !== 'other')
                    .map((id) => {
                      const amenity = amenities.find((a) => a.id === id);
                      if (!amenity) return null;
                      const Icon = amenity.icon;
                      return (
                        <div key={id} className="flex items-center gap-2 py-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{amenity.label}</span>
                        </div>
                      );
                    })}
                  {/* Custom amenities */}
                  {formData.customAmenities.map((custom) => (
                    <div key={custom} className="flex items-center gap-2 py-2">
                      <Check className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{custom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {formData.description && (
              <div>
                <h3 className="font-semibold text-foreground mb-2">About this venue</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.description}
                </p>
              </div>
            )}

            {/* Opening Hours Preview */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Opening Hours</h3>
              <div className="space-y-1">
                {formData.schedule.filter(s => s.enabled).map((day) => (
                  <div key={day.day} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{day.fullDay}</span>
                    <span className="font-medium">{day.open} - {day.close}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 space-y-3">
          {currentStep === 4 ? (
            <>
              <Button
                onClick={handlePublish}
                className="w-full bg-success hover:bg-success/90 text-white"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  "Publishing..."
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Publish Listing
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="w-full"
              >
                Edit Listing
              </Button>
            </>
          ) : (
            <Button onClick={handleNext} className="w-full">
              Next Step
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
