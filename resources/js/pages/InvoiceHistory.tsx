import { useState } from "react";
import { Archive, Printer, FileX } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { DataGrid } from "@/components/ui/DataGrid";
import { FuelBadge, FuelType } from "@/components/ui/FuelBadge";
import { useToast } from "@/hooks/use-toast";

interface Company {
  value: string;
  label: string;
}

interface InvoiceHistoryProps {
  companies: Company[];
}

// Generate years dynamically from current year back to 10 years
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 6; i++) {
    const year = currentYear - i;
    years.push({ value: year.toString(), label: year.toString() });
  }
  return years;
};

const years = generateYears();

const months = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

interface HistoryRecord {
  id: string;
  refNo: string;
  company: string;
  vehicle: string;
  date: string;
  fuelType: FuelType;
  unitPrice: number;
  vatPercent: number;
  volume: number;
  total: number;
}

interface InvoiceOption {
  value: string;
  label: string;
  invoiceDate: string;
  fromDate: string;
  toDate: string;
  records: HistoryRecord[];
}

export default function InvoiceHistory({ companies }: InvoiceHistoryProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    company: "",
    year: "2026",
    month: "01",
  });
  const [availableInvoices, setAvailableInvoices] = useState<InvoiceOption[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [metadata, setMetadata] = useState<{ invoiceNo: string; invoiceDate: string; fromDate: string; toDate: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleView = async () => {
    if (!filters.company) {
      toast({
        title: "Select Company",
        description: "Please select a company to view invoices.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get selected company name
      const selectedCompany = companies.find(c => c.value === filters.company);
      if (!selectedCompany) {
        toast({
          title: "Error",
          description: "Selected company not found.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/history/tax-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          company_name: selectedCompany.label,
          year: filters.year,
          month: filters.month,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setAvailableInvoices(data.invoices || []);
        setSelectedInvoice("");
        setRecords([]);
        setMetadata(null);

        if (!data.invoices || data.invoices.length === 0) {
          toast({
            title: "No Invoices Found",
            description: "No invoices found for the selected period.",
          });
        } else {
          toast({
            title: "Invoices Loaded",
            description: `Found ${data.invoices.length} invoice(s) for the selected period.`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load invoices.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load invoices.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceSelect = async (invoiceValue: string) => {
    setSelectedInvoice(invoiceValue);
    const invoice = availableInvoices.find((inv) => inv.value === invoiceValue);
    if (invoice) {
      setMetadata({
        invoiceNo: invoice.label,
        invoiceDate: invoice.invoiceDate,
        fromDate: invoice.fromDate,
        toDate: invoice.toDate,
      });

      // Fetch daily invoice records for this tax invoice
      try {
        const response = await fetch('/api/history/tax-invoice-records', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify({
            tax_invoice_id: invoiceValue,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setRecords(data.records);
        } else {
          toast({
            title: "Error",
            description: "Failed to load invoice records.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load invoice records.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePrint = async () => {
    if (!selectedInvoice || !metadata) {
      toast({
        title: "No Invoice Selected",
        description: "Please select an invoice to print.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/history/generate-tax-invoice-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          tax_invoice_id: selectedInvoice,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate PDF.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    }
  };

  const columns = [
    { key: "refNo", header: "Ref No", sortable: true },
    { key: "company", header: "Company" },
    { key: "vehicle", header: "Vehicle" },
    { key: "date", header: "Date", sortable: true },
    {
      key: "fuelType",
      header: "Fuel",
      render: (row: HistoryRecord) => <FuelBadge type={row.fuelType} />,
    },
    {
      key: "unitPrice",
      header: "Unit Price",
      align: "right" as const,
      render: (row: HistoryRecord) => `LKR ${Math.round(row.unitPrice)}`,
    },
    {
      key: "vatPercent",
      header: "VAT %",
      align: "right" as const,
      render: (row: HistoryRecord) => `${row.vatPercent}%`,
    },
    {
      key: "volume",
      header: "Volume",
      align: "right" as const,
      render: (row: HistoryRecord) => `${row.volume.toFixed(3)} L`,
    },
    {
      key: "total",
      header: "Total",
      align: "right" as const,
      render: (row: HistoryRecord) => (
        <span className="font-semibold text-primary">
          LKR {Math.round(row.total).toLocaleString("en-US")}
        </span>
      ),
    },
  ];

  const invoiceOptions = availableInvoices.map((inv) => ({ value: inv.value, label: inv.label }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-accent/10">
            <Archive className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Invoice History</h1>
            <p className="text-muted-foreground mt-1">Access archived invoices and historical data</p>
          </div>
        </div>
      </div>

      {/* Search Controls */}
      <div className="card-neumorphic p-6 space-y-6 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchableSelect
            label="Company Name"
            options={companies}
            value={filters.company}
            onChange={(value) => setFilters({ ...filters, company: value })}
          />
          <SearchableSelect
            label="Year"
            options={years}
            value={filters.year}
            onChange={(value) => setFilters({ ...filters, year: value })}
          />
          <SearchableSelect
            label="Month"
            options={months}
            value={filters.month}
            onChange={(value) => setFilters({ ...filters, month: value })}
          />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={handleView} className="btn-primary-glow" disabled={isLoading}>
            {isLoading ? "Loading..." : "View"}
          </button>
        </div>
      </div>

      {/* Invoice Selection */}
      {availableInvoices.length > 0 && (
        <div className="card-neumorphic p-6 animate-fade-slide-up" style={{ animationDelay: "0.15s" }}>
          <SearchableSelect
            label="Select Invoice"
            options={invoiceOptions}
            value={selectedInvoice}
            onChange={handleInvoiceSelect}
            placeholder="Select an invoice to view details"
          />
        </div>
      )}

      {/* Metadata Context Bar */}
      {metadata && (
        <div
          className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex flex-wrap items-center gap-6 animate-fade-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Invoice No</span>
            <p className="font-semibold text-foreground">{metadata.invoiceNo}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Date</span>
            <p className="font-semibold text-foreground">{metadata.invoiceDate}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">From Date</span>
            <p className="font-semibold text-foreground">{metadata.fromDate}</p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">To Date</span>
            <p className="font-semibold text-foreground">{metadata.toDate}</p>
          </div>
        </div>
      )}

      {/* Historical Data Grid */}
      {records.length > 0 ? (
        <div className="space-y-4 animate-fade-slide-up" style={{ animationDelay: "0.25s" }}>
          <DataGrid columns={columns} data={records} pageSize={10} />

          {/* Actions Bar */}
          <div className="card-neumorphic p-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="btn-success-glow flex items-center gap-2"
            >
              <Printer className="h-5 w-5" />
              Print
            </button>
          </div>
        </div>
      ) : availableInvoices.length > 0 && !selectedInvoice ? (
        <div className="card-neumorphic p-12 text-center animate-fade-slide-up" style={{ animationDelay: "0.25s" }}>
          <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Select an Invoice</h3>
          <p className="text-muted-foreground">Choose an invoice from the dropdown above to view its details.</p>
        </div>
      ) : null}
    </div>
  );
}
