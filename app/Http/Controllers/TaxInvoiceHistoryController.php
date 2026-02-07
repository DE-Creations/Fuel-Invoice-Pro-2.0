<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use App\Models\Company;

class TaxInvoiceHistoryController extends Controller
{
    /**
     * Display the Tax Invoice History page
     */
    public function index()
    {
        $companies = Company::getActiveCompanies();

        return Inertia::render('InvoiceHistory', [
            'companies' => $companies,
        ]);
    }

    /**
     * Get tax invoices for selected company, year, and month
     */
    public function getTaxInvoices(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string',
            'year' => 'required|string',
            'month' => 'required|string',
        ]);

        $startDate = $request->year . '-' . $request->month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate)); // Last day of the month

        $taxInvoices = DB::table('tax_invoice')
            ->where('company_name', $request->company_name)
            ->whereBetween('invoice_date', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->select(
                'id',
                'tax_invoice_no',
                'invoice_date',
                'company_name',
                'vehicle_no',
                'from_date',
                'to_date'
            )
            ->orderBy('invoice_date', 'desc')
            ->get()
            ->map(function ($invoice) {
                return [
                    'value' => $invoice->id,
                    'label' => $invoice->tax_invoice_no,
                    'invoiceDate' => date('Y-m-d', strtotime($invoice->invoice_date)),
                    'fromDate' => $invoice->from_date,
                    'toDate' => $invoice->to_date,
                    'vehicleNo' => $invoice->vehicle_no,
                ];
            });

        return response()->json([
            'success' => true,
            'invoices' => $taxInvoices,
        ]);
    }

    /**
     * Get daily invoice records for a selected tax invoice
     */
    public function getTaxInvoiceRecords(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
        ]);

        // Get daily invoice records linked to this tax invoice
        $query = DB::table('tax_invoice_invoice_nos')
            ->join('invoice_daily', 'tax_invoice_invoice_nos.invoice_daily_id', '=', 'invoice_daily.id')
            ->join('vehicle', 'invoice_daily.vehicle_id', '=', 'vehicle.id')
            ->join('company', 'vehicle.company_id', '=', 'company.id')
            ->join('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
            ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
            ->whereNull('invoice_daily.deleted_at')
            ->select(
                'invoice_daily.id as id',
                'invoice_daily.serial_no as refNo',
                'company.name as company',
                'vehicle.vehicle_no as vehicle',
                'invoice_daily.date_added as date',
                'fuel_type.name as fuelType',
                'invoice_daily.fuel_net_price as unitPrice',
                'invoice_daily.vat_percentage as vatPercent',
                'invoice_daily.volume',
                'invoice_daily.Total as total'
            )
            ->orderBy('invoice_daily.date_added', 'asc')
            ->orderBy('invoice_daily.id', 'asc');

        // Get grand total directly from tax_invoice table
        $grandTotal = DB::table('tax_invoice')
            ->where('id', $request->tax_invoice_id)
            ->value('total_amount') ?? 0;

        $invoices = $query->paginate(20);

        $records = $invoices->getCollection()->map(function ($record) {
            return [
                'id' => (string) $record->id,
                'refNo' => $record->refNo,
                'company' => $record->company,
                'vehicle' => $record->vehicle,
                'date' => date('Y-m-d', strtotime($record->date)),
                'fuelType' => $this->mapFuelType($record->fuelType),
                'unitPrice' => round($record->unitPrice),
                'vatPercent' => (float) $record->vatPercent,
                'volume' => (float) $record->volume,
                'total' => round($record->total),
            ];
        });

        // Set the transformed collection back
        $invoices->setCollection($records);

        return response()->json([
            'success' => true,
            'records' => $records,
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'total' => $invoices->total(),
            'grand_total' => $grandTotal,
        ]);
    }

    /**
     * Generate PDF for existing tax invoice from history
     */
    public function generateTaxInvoicePDF(Request $request)
    {
        $request->validate([
            'tax_invoice_id' => 'required|integer',
        ]);

        try {
            // Get tax invoice data
            $taxInvoice = DB::table('tax_invoice')
                ->leftJoin('payment_method', 'tax_invoice.payment_method_id', '=', 'payment_method.id')
                ->where('tax_invoice.id', $request->tax_invoice_id)
                ->select('tax_invoice.*', 'payment_method.name as payment_mode')
                ->first();

            if (!$taxInvoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tax invoice not found',
                ], 404);
            }

            // Get invoice records
            $records = DB::table('tax_invoice_invoice_nos')
                ->join('invoice_daily', 'tax_invoice_invoice_nos.invoice_daily_id', '=', 'invoice_daily.id')
                ->join('vehicle', 'invoice_daily.vehicle_id', '=', 'vehicle.id')
                ->join('fuel_type', 'invoice_daily.fuel_type_id', '=', 'fuel_type.id')
                ->where('tax_invoice_invoice_nos.tax_invoice_id', $request->tax_invoice_id)
                ->select(
                    'invoice_daily.serial_no as refNo',
                    'vehicle.vehicle_no as vehicle',
                    'invoice_daily.date_added as date',
                    'fuel_type.name as fuelType',
                    'invoice_daily.fuel_net_price as unitPrice',
                    'invoice_daily.vat_percentage as vatPercent',
                    'invoice_daily.volume',
                    'invoice_daily.Total as total'
                )
                ->orderBy('invoice_daily.date_added')
                ->get();

            // Get settings/company data for header
            $settings = DB::table('settings')
                ->select('company_name', 'company_address', 'company_contact', 'company_vat_no', 'place_of_supply')
                ->first();

            // Get customer company details
            $customerCompany = DB::table('company')
                ->where('name', $taxInvoice->company_name)
                ->whereNull('deleted_at')
                ->select('address', 'vat_no', 'contact_number')
                ->first();

            // Process records for PDF table
            $recordsArray = [];

            foreach ($records as $record) {
                // Calculate item subtotal for display
                $vatRate = $record->vatPercent / 100;
                $itemSubtotal = $record->total / (1 + $vatRate);

                $recordsArray[] = [
                    'refNo' => $record->refNo,
                    'vehicle' => $record->vehicle,
                    'date' => date('Y-m-d', strtotime($record->date)),
                    'fuelType' => $record->fuelType,
                    'unitPrice' => round($record->unitPrice),
                    'vatPercent' => $record->vatPercent,
                    'volume' => $record->volume,
                    'amountExclVat' => round($itemSubtotal),
                    'total' => round($record->total),
                ];
            }

            // Get totals directly from tax_invoice table
            $subtotal = $taxInvoice->subtotal;
            $vatPercentage = $taxInvoice->vat_percentage;
            $vatAmount = $taxInvoice->vat_amount;
            $grandTotal = $taxInvoice->total_amount;
            $totalInWords = $this->convertNumberToWords($grandTotal) . ' Rupees Only';

            // Prepare PDF data
            $pdfData = [
                'companyName' => $settings->company_name,
                'companyAddress' => $settings->company_address,
                'companyPhone' => $settings->company_contact,
                'companyVatNo' => $settings->company_vat_no,
                'placeOfSupply' => $settings->place_of_supply ?? '',
                'printedDateTime' => date('Y-m-d', strtotime($taxInvoice->invoice_date)),
                'customerName' => $taxInvoice->company_name,
                'customerAddress' => $customerCompany->address ?? '',
                'customerPhone' => $customerCompany->contact_number ?? '',
                'customerVatNo' => $customerCompany->vat_no ?? '',
                'fromDate' => date('Y-m-d', strtotime($taxInvoice->from_date)),
                'toDate' => date('Y-m-d', strtotime($taxInvoice->to_date)),
                'taxInvoiceNumber' => $taxInvoice->tax_invoice_no,
                'paymentMode' => $taxInvoice->payment_mode ?? 'N/A',
                'vatPercentage' => $vatPercentage,
                'records' => $recordsArray,
                'subtotal' => $subtotal,
                'vatAmount' => $vatAmount,
                'grandTotal' => $grandTotal,
                'totalInWords' => $totalInWords,
            ];

            // Generate PDF
            $pdf = Pdf::loadView('pdf.tax-invoice-history', $pdfData);
            $pdf->set_option('isPhpEnabled', true); // Allow inline PHP for page numbers
            $pdf->setPaper('A4', 'portrait');

            // Update the updated_at timestamp when printing
            DB::table('tax_invoice')
                ->where('id', $request->tax_invoice_id)
                ->update(['updated_at' => now()]);

            // Sanitize filename by replacing invalid characters
            $safeFilename = str_replace(['/', '\\'], '-', $taxInvoice->tax_invoice_no);
            return $pdf->stream('tax-invoice-' . $safeFilename . '.pdf');
        } catch (\Exception $e) {
            Log::error('PDF Generation Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Map fuel type names to display format
     */
    private function mapFuelType($fuelType)
    {
        $mapping = [
            'Auto Diesel' => 'AD',
            'Super Diesel' => 'SD',
            'Petrol 92' => 'P92',
            'Petrol 95' => 'P95',
        ];

        return $mapping[$fuelType] ?? $fuelType;
    }

    /**
     * Convert number to words
     */
    private function convertNumberToWords($number)
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        $teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        $number = round($number); // Round to nearest integer

        if ($number == 0) {
            return 'Zero';
        }

        $words = '';

        // Billion (1,000,000,000)
        if ($number >= 1000000000) {
            $billions = floor($number / 1000000000);
            $words .= $this->convertNumberToWords($billions) . ' Billion ';
            $number %= 1000000000;
        }

        // Million (1,000,000)
        if ($number >= 1000000) {
            $millions = floor($number / 1000000);
            $words .= $this->convertNumberToWords($millions) . ' Million ';
            $number %= 1000000;
        }

        // Thousands (1,000)
        if ($number >= 1000) {
            $thousands = floor($number / 1000);
            $words .= $this->convertNumberToWords($thousands) . ' Thousand ';
            $number %= 1000;
        }

        // Hundreds (100)
        if ($number >= 100) {
            $hundreds = floor($number / 100);
            $words .= $ones[$hundreds] . ' Hundred ';
            $number %= 100;
        }

        // Tens and ones
        if ($number >= 20) {
            $tensDigit = floor($number / 10);
            $onesDigit = $number % 10;
            $words .= $tens[$tensDigit];
            if ($onesDigit > 0) {
                $words .= ' ' . $ones[$onesDigit];
            }
        } elseif ($number >= 10) {
            $words .= $teens[$number - 10];
        } elseif ($number > 0) {
            $words .= $ones[$number];
        }

        return trim($words);
    }
}
