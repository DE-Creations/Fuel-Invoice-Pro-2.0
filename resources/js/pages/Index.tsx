import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { useToast } from "@/hooks/use-toast";

interface Company {
  value: string;
  label: string;
}

interface Vehicle {
  value: string;
  label: string;
  fuel_category_fuel_category_id: number;
}

interface FuelTypeOption {
  value: string;
  label: string;
  price: number;
}

interface IndexProps {
  companies: Company[];
  initialVatPercentage: number;
}

export default function Index({ companies, initialVatPercentage }: IndexProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelTypeOption[]>([]);
  const [fuelPrice, setFuelPrice] = useState(0);
  const [vatPercentage] = useState(initialVatPercentage);

  const [formData, setFormData] = useState({
    serialNo: "",
    date: new Date(),
    company: "",
    vehicle: "",
    fuelType: "",
    volume: "",
  });

  // Number formatter for currency
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Fetch vehicles when company changes
  useEffect(() => {
    if (formData.company) {
      fetchVehicles(formData.company);
      // Reset dependent fields
      setFormData(prev => ({ ...prev, vehicle: "", fuelType: "" }));
      setVehicles([]);
      setFuelTypes([]);
      setFuelPrice(0);
    }
  }, [formData.company]);

  // Fetch fuel types when vehicle changes
  useEffect(() => {
    if (formData.vehicle) {
      fetchFuelTypes(formData.vehicle);
      // Reset fuel type
      setFormData(prev => ({ ...prev, fuelType: "" }));
      setFuelTypes([]);
      setFuelPrice(0);
    }
  }, [formData.vehicle]);

  // Fetch fuel price when fuel type changes
  useEffect(() => {
    if (formData.fuelType) {
      fetchFuelPrice(formData.fuelType);
    }
  }, [formData.fuelType]);

  const fetchVehicles = async (companyId: string) => {
    try {
      const response = await fetch(`/api/invoice/vehicles/${companyId}`);
      const data = await response.json();
      setVehicles(data.vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicles",
        variant: "destructive",
      });
    }
  };

  const fetchFuelTypes = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/invoice/fuel-types/${vehicleId}`);
      const data = await response.json();
      setFuelTypes(data.fuelTypes);
    } catch (error) {
      console.error('Error fetching fuel types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fuel types",
        variant: "destructive",
      });
    }
  };

  const fetchFuelPrice = async (fuelTypeId: string) => {
    try {
      const response = await fetch(`/api/invoice/fuel-price/${fuelTypeId}`);
      const data = await response.json();
      setFuelPrice(data.price);
    } catch (error) {
      console.error('Error fetching fuel price:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fuel price",
        variant: "destructive",
      });
    }
  };

  // Calculation values
  const volume = parseFloat(formData.volume) || 0;
  const fuelPriceFromDB = fuelPrice; // This is the total price from database
  const FuelNetPrice = Math.round((fuelPrice / (100 + vatPercentage)) * 100);
  const vatAmountPerLiter = Math.round((fuelPrice / (100 + vatPercentage)) * vatPercentage);
  const subTotal = Math.round(FuelNetPrice * volume);
  const vatAmount = Math.round(vatAmountPerLiter * volume);
  const total = Math.round(fuelPrice * volume);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const invoiceData = {
        serial_no: formData.serialNo,
        date_added: formData.date.toISOString().split('T')[0],
        vehicle_id: formData.vehicle,
        fuel_type_id: formData.fuelType,
        volume: volume,
        fuel_net_price: FuelNetPrice,
        sub_total: subTotal,
        vat_percentage: vatPercentage,
        vat_amount: vatAmount,
        total: total,
      };

      const response = await fetch('/api/invoice/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Invoice Saved Successfully",
          description: `Invoice ${formData.serialNo} has been saved.`,
        });

        // Reset form
        setFormData({
          serialNo: "",
          date: new Date(),
          company: "",
          vehicle: "",
          fuelType: "",
          volume: "",
        });
        setVehicles([]);
        setFuelTypes([]);
        setFuelPrice(0);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to save invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving the invoice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 animate-fade-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Invoice Form <span className="text-muted-foreground font-normal">(Daily)</span>
        </h1>
        <p className="text-muted-foreground mt-1">Create and manage daily fuel invoices</p>
      </div>

      {/* Invoice Card */}
      <div className="card-neumorphic-elevated p-6 lg:p-8 animate-card-entrance">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Primary Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            <FloatingInput
              label="Serial No"
              value={formData.serialNo}
              onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
              placeholder=""
            />
            <DatePickerField
              label="Date"
              value={formData.date}
              onChange={(date) => setFormData({ ...formData, date: date || new Date() })}
            />
          </div>

          {/* Selection Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            <SearchableSelect
              label="Company Name"
              options={companies}
              value={formData.company}
              onChange={(value) => setFormData({ ...formData, company: value })}
              placeholder="Select company"
            />
            <SearchableSelect
              label="Vehicle No"
              options={vehicles}
              value={formData.vehicle}
              onChange={(value) => setFormData({ ...formData, vehicle: value })}
              placeholder="Select vehicle"
              disabled={!formData.company || vehicles.length === 0}
            />
          </div>

          {/* Fuel Type Selection */}
          <div className="stagger-children">
            <SearchableSelect
              label="Fuel Type"
              options={fuelTypes}
              value={formData.fuelType}
              onChange={(value) => setFormData({ ...formData, fuelType: value })}
              placeholder="Select fuel type"
              disabled={!formData.vehicle || fuelTypes.length === 0}
              searchable={false}
            />
          </div>

          {/* Volume Input - Primary */}
          <div className="stagger-children">
            <FloatingInput
              label="Volume (Liters)"
              type="number"
              step="0.01"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              className="border-2 border-primary/30 focus:border-primary"
            />
          </div>

          {/* Financial Summary */}
          <div className="bg-secondary/30 rounded-2xl p-6 space-y-4 border border-border/50">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Financial Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Fuel Net Price</span>
                <span className="font-medium">LKR {formatCurrency(FuelNetPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Sub Total</span>
                <span className="font-medium">LKR {formatCurrency(subTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">VAT ({vatPercentage}%)</span>
                <span className="font-medium">LKR {formatCurrency(vatAmount)}</span>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="hero-metric">LKR {formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.company || !formData.vehicle || !formData.volume || !formData.serialNo}
            className="btn-primary-glow w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Invoice"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
