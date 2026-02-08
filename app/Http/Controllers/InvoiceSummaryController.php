<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\PaymentMethod;
use App\Models\TaxInvoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Inertia\Inertia;

class InvoiceSummaryController extends Controller
{
    public function index()
    {
        $companies = Company::orderBy('id')
            ->select('id as value', 'name as label')
            ->get();

        $paymentMethods = PaymentMethod::orderBy('name')
            ->select('id as value', 'name as label')
            ->get();

        return Inertia::render('InvoiceSummary', [
            'companies' => $companies,
            'paymentMethods' => $paymentMethods
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'company_id' => 'nullable|exists:company,id',
            'payment_method_id' => 'nullable|exists:payment_method,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::with('paymentMethod')
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->company_id) {
            $company = Company::find($request->company_id);
            if ($company) {
                $query->where('company_name', $company->name);
            }
        }

        if ($request->payment_method_id) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        // Calculate totals using a clone of the query logic
        $totalsQuery = clone $query;
        $totals = [
            'sum_net' => $totalsQuery->sum('subtotal'),
            'sum_vat' => $totalsQuery->sum('vat_amount'),
            'sum_total' => $totalsQuery->sum('total_amount'),
        ];

        $invoices = $query->orderBy('invoice_date', 'desc')
                          ->orderBy('tax_invoice_no', 'desc')
                          ->paginate(20);

        // Transform the paginated items
        $invoices->getCollection()->transform(function ($invoice) {
            $invoiceArray = $invoice->toArray();
            $invoiceArray['payment_method_name'] = $invoice->paymentMethod->name ?? 'N/A';
            return $invoiceArray;
        });

        return response()->json([
            'invoices' => $invoices,
            'totals' => $totals
        ]);
    }

    public function print(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'company_id' => 'nullable|exists:company,id',
            'payment_method_id' => 'nullable|exists:payment_method,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::with('paymentMethod')
            ->whereBetween('invoice_date', [$fromDate, $toDate]);

        $companyName = 'All Companies';
        if ($request->company_id) {
            $company = Company::find($request->company_id);
            if ($company) {
                $query->where('company_name', $company->name);
                $companyName = $company->name;
            }
        }

        $paymentMethodName = 'All Methods';
        if ($request->payment_method_id) {
            $query->where('payment_method_id', $request->payment_method_id);
            $paymentMethod = PaymentMethod::find($request->payment_method_id);
            if ($paymentMethod) {
                $paymentMethodName = $paymentMethod->name;
            }
        }

        $invoices = $query->orderBy('invoice_date', 'asc')
                          ->orderBy('tax_invoice_no', 'asc')
                          ->get();

        $totals = [
            'sum_net' => $invoices->sum('subtotal'),
            'sum_vat' => $invoices->sum('vat_amount'),
            'sum_total' => $invoices->sum('total_amount'),
        ];

        $pdf = Pdf::loadView('pdf.tax-invoice-summery', [
            'invoices' => $invoices,
            'totals' => $totals,
            'fromDate' => $fromDate,
            'toDate' => $toDate,
            'companyName' => $companyName,
            'paymentMethodName' => $paymentMethodName
        ]);

        return $pdf->stream('invoice-summary.pdf');
    }
}
