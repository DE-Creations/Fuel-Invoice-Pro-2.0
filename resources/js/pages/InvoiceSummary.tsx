import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Search, Printer, FileX, Loader2 } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DatePickerField } from '@/components/ui/DatePickerField';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SelectOption {
    value: string;
    label: string;
}

interface PageProps {
    companies: SelectOption[];
}

interface Invoice {
    id: number;
    invoice_date: string;
    tax_invoice_no: string;
    company_name: string;
    subtotal: number;
    vat_amount: number;
    total_amount: number;
}

interface InvoiceTotals {
    sum_net: number;
    sum_vat: number;
    sum_total: number;
}

export default function InvoiceSummary({ companies }: PageProps) {
    const { toast } = useToast();
    const [filters, setFilters] = useState({
        companyId: '',
        fromDate: undefined as Date | undefined,
        toDate: undefined as Date | undefined,
    });
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [totals, setTotals] = useState<InvoiceTotals | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!filters.fromDate || !filters.toDate) {
            toast({
                title: 'Validation Error',
                description: 'Please select both From Date and To Date',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                from_date: format(filters.fromDate, 'yyyy-MM-dd'),
                to_date: format(filters.toDate, 'yyyy-MM-dd'),
                company_id: filters.companyId || '',
            });

            const response = await fetch(`/api/invoice-summary/search?${queryParams}`);
            const data = await response.json();

            setInvoices(data.invoices);
            setTotals(data.totals);
            setHasSearched(true);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch invoice summary',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!filters.fromDate || !filters.toDate) return;

        const queryParams = new URLSearchParams({
            from_date: format(filters.fromDate, 'yyyy-MM-dd'),
            to_date: format(filters.toDate, 'yyyy-MM-dd'),
            company_id: filters.companyId || '',
        });

        window.open(`/api/invoice-summary/print?${queryParams}`, '_blank');
    };

    // Add "All Companies" option to the list
    const companyOptions = [
        { value: '', label: 'All Companies' },
        ...companies
    ];

    return (
        <div className="space-y-6">
            <Head title="Invoice Summary" />

            {/* Header */}
            <div className="animate-fade-slide-up">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    Invoice Summary
                </h1>
                <p className="text-muted-foreground mt-1">
                    View and print summary of tax invoices
                </p>
            </div>

            {/* Filter Panel */}
            <div className="card-neumorphic p-6 space-y-6 animate-fade-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SearchableSelect
                        label="Company"
                        options={companyOptions}
                        value={filters.companyId}
                        onChange={(value) => setFilters({ ...filters, companyId: value })}
                    />
                    <DatePickerField
                        label="From Date"
                        value={filters.fromDate}
                        onChange={(date) => setFilters({ ...filters, fromDate: date })}
                    />
                    <DatePickerField
                        label="To Date"
                        value={filters.toDate}
                        onChange={(date) => setFilters({ ...filters, toDate: date })}
                    />
                </div>
                <div className="flex justify-end gap-2">
                     {hasSearched && invoices.length > 0 && (
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Printer className="h-4 w-4" />
                            Print Summary
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="btn-primary-glow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Search className="h-5 w-5" />
                        )}
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {hasSearched && (
                <div className="animate-fade-slide-up" style={{ animationDelay: '0.2s' }}>
                    {invoices.length === 0 ? (
                        <div className="card-neumorphic p-12 text-center">
                            <FileX className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                No Invoices Found
                            </h3>
                            <p className="text-muted-foreground">
                                Adjust your filters to see results.
                            </p>
                        </div>
                    ) : (
                        <div className="card-neumorphic overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold">Invoice No</th>
                                            <th className="px-6 py-3 font-semibold">Company</th>
                                            <th className="px-6 py-3 font-semibold text-right">Net Value</th>
                                            <th className="px-6 py-3 font-semibold text-right">VAT</th>
                                            <th className="px-6 py-3 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="bg-card hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-medium">
                                                    {format(new Date(invoice.invoice_date), 'yyyy-MM-dd')}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-primary">
                                                    {invoice.tax_invoice_no}
                                                </td>
                                                <td className="px-6 py-4">{invoice.company_name}</td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    {Number(invoice.vat_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold whitespace-nowrap">
                                                    {Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {totals && (
                                        <tfoot className="bg-muted/50 font-bold border-t-2 border-border">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-right uppercase text-muted-foreground">
                                                    Grand Total
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {totals.sum_net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {totals.sum_vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {totals.sum_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
