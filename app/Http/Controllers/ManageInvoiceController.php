<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Vehicle;
use App\Models\FuelType;
use App\Models\Vat;
use App\Models\InvoiceDaily;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManageInvoiceController extends Controller
{
    /**
     * Display the manage invoices page
     */
    public function index()
    {
        return Inertia::render('ManageInvoices');
    }

    /**
     * Get paginated invoices for management
     */
    public function getInvoices(Request $request)
    {
        $perPage = 20;

        // Get invoices from last 30 days only
        $thirtyDaysAgo = now()->subDays(30)->startOfDay();

        $invoices = InvoiceDaily::with(['vehicle.company', 'fuelType'])
            ->where('date_added', '>=', $thirtyDaysAgo)
            ->orderBy('date_added', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        $formattedInvoices = $invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'serialNo' => $invoice->serial_no,
                'date' => $invoice->date_added->format('Y-m-d'),
                'company' => $invoice->vehicle->company->name ?? 'N/A',
                'vehicle' => $invoice->vehicle->vehicle_no ?? 'N/A',
                'fuelType' => $invoice->fuelType->name ?? 'N/A',
                'volume' => $invoice->volume,
                'total' => round($invoice->Total),
            ];
        });

        return response()->json([
            'data' => $formattedInvoices,
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'total' => $invoices->total(),
        ]);
    }

    /**
     * Get invoice details for editing
     */
    public function getInvoiceDetails($id)
    {
        try {
            $invoice = InvoiceDaily::with(['vehicle.company', 'fuelType'])
                ->where('id', $id)
                ->firstOrFail();

            // Get all companies
            $companies = Company::whereNull('deleted_at')
                ->select('id as value', 'name as label')
                ->get();

            // Get vehicles for the invoice's company
            $vehicles = Vehicle::where('company_id', $invoice->vehicle->company_id)
                ->whereNull('deleted_at')
                ->select('id as value', 'vehicle_no as label', 'fuel_category_id')
                ->get();

            // Get fuel types for the vehicle's fuel category
            $fuelTypes = FuelType::where('fuel_category_id', $invoice->vehicle->fuel_category_id)
                ->select('id as value', 'name as label', 'price')
                ->get();

            // Get current VAT
            $vatPercentage = Vat::getCurrentVatPercentage();

            return response()->json([
                'success' => true,
                'invoice' => [
                    'serialNo' => $invoice->serial_no,
                    'date' => $invoice->date_added->format('Y-m-d'),
                    'companyId' => (string)$invoice->vehicle->company_id,
                    'vehicleId' => (string)$invoice->vehicle_id,
                    'fuelTypeId' => (string)$invoice->fuel_type_id,
                    'volume' => $invoice->volume,
                ],
                'companies' => $companies,
                'vehicles' => $vehicles,
                'fuelTypes' =>$fuelTypes,
                'vatPercentage' => $vatPercentage,
                'fuelPrice' => $invoice->fuelType->price,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch invoice details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an invoice
     */
    public function updateInvoice(Request $request, $id)
    {
        $request->validate([
            'serial_no' => 'required|string|max:15',
            'date_added' => 'required|date',
            'vehicle_id' => 'required|exists:vehicle,id',
            'fuel_type_id' => 'required|exists:fuel_type,id',
            'volume' => 'required|numeric|min:0',
            'fuel_net_price' => 'required|numeric|min:0',
            'sub_total' => 'required|numeric|min:0',
            'vat_percentage' => 'required|numeric|min:0',
            'vat_amount' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
        ]);

        try {
            $invoice = InvoiceDaily::where('id', $id)->firstOrFail();

            $invoice->update([
                'serial_no' => $request->serial_no,
                'date_added' => $request->date_added,
                'vehicle_id' => $request->vehicle_id,
                'fuel_type_id' => $request->fuel_type_id,
                'volume' => $request->volume,
                'fuel_net_price' => round($request->fuel_net_price),
                'sub_total' => round($request->sub_total),
                'vat_percentage' => round($request->vat_percentage),
                'vat_amount' => round($request->vat_amount),
                'Total' => round($request->total),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Invoice updated successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update invoice: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an invoice
     */
    public function deleteInvoice($id)
    {
        try {
            $invoice = InvoiceDaily::where('id', $id)->firstOrFail();
            $invoice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice'
            ], 500);
        }
    }

    /**
     * Get paginated deleted invoices
     */
    public function getDeletedInvoices(Request $request)
    {
        $perPage = 10;

        $invoices = InvoiceDaily::onlyTrashed()
            ->with(['vehicle.company', 'fuelType'])
            ->orderBy('deleted_at', 'desc')
            ->paginate($perPage);

        $formattedInvoices = $invoices->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'serialNo' => $invoice->serial_no,
                'date' => $invoice->date_added->format('Y-m-d'),
                'company' => $invoice->vehicle->company->name ?? 'N/A',
                'vehicle' => $invoice->vehicle->vehicle_no ?? 'N/A',
                'fuelType' => $invoice->fuelType->name ?? 'N/A',
                'volume' => $invoice->volume ?? 0,
                'total' => round($invoice->Total ?? 0),
                'deletedAt' => $invoice->deleted_at?->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'data' => $formattedInvoices,
            'current_page' => $invoices->currentPage(),
            'last_page' => $invoices->lastPage(),
            'per_page' => $invoices->perPage(),
            'total' => round($invoices->total()),
        ]);
    }

    /**
     * Recover a deleted invoice
     */
    public function recoverInvoice($id)
    {
        try {
            $invoice = InvoiceDaily::onlyTrashed()
                ->where('id', $id)
                ->firstOrFail();

            $invoice->restore();

            return response()->json([
                'success' => true,
                'message' => 'Invoice recovered successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to recover invoice'
            ], 500);
        }
    }
}
