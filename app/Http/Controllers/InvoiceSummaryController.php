<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\TaxInvoice;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Inertia\Inertia;

class InvoiceSummaryController extends Controller
{
    public function index()
    {
        $companies = Company::orderBy('name')
            ->select('id as value', 'name as label')
            ->get();

        return Inertia::render('InvoiceSummary', [
            'companies' => $companies
        ]);
    }

    public function search(Request $request)
    {
        $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'company_id' => 'nullable|exists:company,id',
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::whereBetween('invoice_date', [$fromDate, $toDate]);

        if ($request->company_id) {
            $company = Company::find($request->company_id);
            if ($company) {
                $query->where('company_name', $company->name);
            }
        }

        $invoices = $query->orderBy('invoice_date', 'desc')
                          ->orderBy('tax_invoice_no', 'desc')
                          ->get();

        $totals = [
            'sum_net' => $invoices->sum('subtotal'),
            'sum_vat' => $invoices->sum('vat_amount'),
            'sum_total' => $invoices->sum('total_amount'),
        ];

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
        ]);

        $fromDate = Carbon::parse($request->from_date)->startOfDay();
        $toDate = Carbon::parse($request->to_date)->endOfDay();

        $query = TaxInvoice::whereBetween('invoice_date', [$fromDate, $toDate]);

        $companyName = 'All Companies';
        if ($request->company_id) {
            $company = Company::find($request->company_id);
            if ($company) {
                $query->where('company_name', $company->name);
                $companyName = $company->name;
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
            'companyName' => $companyName
        ]);

        return $pdf->stream('invoice-summary.pdf');
    }
}
