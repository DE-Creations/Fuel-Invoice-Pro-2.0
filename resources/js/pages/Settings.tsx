import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Building2, Receipt, Fuel, MapPin, Phone, FileText, Loader2, Check } from "lucide-react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useToast } from "@/hooks/use-toast";

interface CompanyDetails {
  name: string;
  address: string;
  contact: string;
  vatNo: string;
  place_of_supply?: string;
}

interface CurrentVat {
  percentage: number;
  fromDate: string | null;
  toDate: string | null;
}

interface FuelType {
  id: number;
  name: string;
  price: number;
  netPrice: number;
  vatAmount: number;
}

interface SettingsProps {
  companyDetails: CompanyDetails;
  currentVat: CurrentVat;
  fuelTypes: FuelType[];
}

export default function Settings({ companyDetails, currentVat, fuelTypes }: SettingsProps) {
  const { toast } = useToast();
  const { props } = usePage<{ csrf_token: string }>();
  const [vatPercent, setVatPercent] = useState(currentVat.percentage.toString());
  const [isUpdatingVat, setIsUpdatingVat] = useState(false);
  const [vatSuccess, setVatSuccess] = useState(false);

  const [selectedFuelId, setSelectedFuelId] = useState(fuelTypes[0]?.id.toString() || "");
  const [newFuelPrice, setNewFuelPrice] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [priceSuccess, setPriceSuccess] = useState(false);

  const [fuelTypesData, setFuelTypesData] = useState(fuelTypes);

  // Create options for fuel types dropdown
  const fuelTypeOptions = fuelTypesData.map((ft) => ({
    value: ft.id.toString(),
    label: ft.name,
  }));

  const currentFuelData = fuelTypesData.find((ft) => ft.id.toString() === selectedFuelId);

  const handleUpdateVat = async () => {
    setIsUpdatingVat(true);

    try {
      // Format date in local timezone (YYYY-MM-DD)
      const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const response = await fetch('/api/settings/update-vat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': props.csrf_token,
        },
        body: JSON.stringify({
          vat_percentage: parseFloat(vatPercent),
          from_date: formatDateLocal(new Date()),
          to_date: '2099-12-31',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "VAT Updated",
          description: `VAT percentage has been set to ${vatPercent}%`,
        });
        setVatSuccess(true);
        setTimeout(() => setVatSuccess(false), 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update VAT percentage",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingVat(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!currentFuelData) return;

    setIsUpdatingPrice(true);

    try {
      const response = await fetch('/api/settings/update-fuel-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': props.csrf_token,
        },
        body: JSON.stringify({
          fuel_type_id: currentFuelData.id,
          price: parseFloat(newFuelPrice),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state with new data
        setFuelTypesData(prev =>
          prev.map(ft =>
            ft.id === data.fuelType.id ? data.fuelType : ft
          )
        );

        toast({
          title: "Price Updated",
          description: `${currentFuelData.name} price updated to LKR ${newFuelPrice}`,
        });
        setNewFuelPrice("");
        setPriceSuccess(true);
        setTimeout(() => setPriceSuccess(false), 2000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update fuel price",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage company profile, VAT, and fuel pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Profile Card */}
        <div className="card-neumorphic p-6 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Company Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xl font-bold text-foreground">{companyDetails.name}</p>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">{companyDetails.address}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">{companyDetails.contact}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">{companyDetails.vatNo}</p>
            </div>
            <div className="flex items-start gap-3 text-sm mt-5">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">{companyDetails.place_of_supply}</p>
            </div>
          </div>
        </div>

        {/* VAT Settings Card */}
        <div className="card-neumorphic-elevated p-6 animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-warning/10">
              <Receipt className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">VAT Settings</h2>
          </div>

          <div className="space-y-4">
            <FloatingInput
              label="VAT Percentage (%)"
              type="number"
              step="0.1"
              value={vatPercent}
              onChange={(e) => setVatPercent(e.target.value)}
            />

            <button
              type="button"
              onClick={handleUpdateVat}
              disabled={isUpdatingVat || !vatPercent}
              className="btn-success-glow w-full flex items-center justify-center gap-2"
            >
              {isUpdatingVat ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : vatSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  Updated!
                </>
              ) : (
                "Update VAT"
              )}
            </button>
          </div>
        </div>

        {/* Fuel Pricing Calculator Card */}
        <div className="card-neumorphic-elevated p-6 animate-fade-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-warning/10">
              <Fuel className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Fuel Pricing</h2>
          </div>

          <div className="space-y-4">
            <SearchableSelect
              label="Fuel Type"
              options={fuelTypeOptions}
              value={selectedFuelId}
              onChange={setSelectedFuelId}
            />

            {/* Current Pricing Display */}
            {currentFuelData && (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Price</span>
                  <span className="font-semibold">LKR {currentFuelData.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Net Price</span>
                  <span className="font-medium">LKR {currentFuelData.netPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT Amount</span>
                  <span className="font-medium">LKR {currentFuelData.vatAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <FloatingInput
              label="New Fuel Price (LKR)"
              type="number"
              step="0.01"
              value={newFuelPrice}
              onChange={(e) => setNewFuelPrice(e.target.value)}
              className="border-2 border-warning/30 focus:border-warning"
            />

            <button
              type="button"
              onClick={handleUpdatePrice}
              disabled={isUpdatingPrice || !newFuelPrice}
              className="btn-success-glow w-full flex items-center justify-center gap-2"
            >
              {isUpdatingPrice ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : priceSuccess ? (
                <>
                  <Check className="h-5 w-5" />
                  Updated!
                </>
              ) : (
                "Update Price"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
