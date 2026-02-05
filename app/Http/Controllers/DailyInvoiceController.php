<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Vehicle;
use App\Models\FuelType;
use App\Models\Vat;
use App\Models\InvoiceDaily;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DailyInvoiceController extends Controller
{
    /**
     * Display the invoice form with initial data
     */
    public function index()
    {
        $companies = Company::whereNull('deleted_at')
            ->select('id as value', 'name as label')
            ->get();

        $vatPercentage = Vat::getCurrentVatPercentage();

        return Inertia::render('Index', [
            'companies' => $companies,
            'initialVatPercentage' => $vatPercentage,
        ]);
    }

    /**
     * Get vehicles for a specific company
     */
    public function getVehiclesByCompany($company_id)
    {
        $vehicles = Vehicle::where('company_id', $company_id)
            ->whereNull('deleted_at')
            ->select('id as value', 'vehicle_no as label', 'fuel_category_id')
            ->get();

        return response()->json([
            'vehicles' => $vehicles
        ]);
    }

    /**
     * Get fuel types for a specific vehicle
     */
    public function getFuelTypesByVehicle($vehicle_id)
    {
        $vehicle = Vehicle::where('id', $vehicle_id)->first();

        if (!$vehicle) {
            return response()->json(['error' => 'Vehicle not found'], 404);
        }

        $fuelTypes = FuelType::where('fuel_category_id', $vehicle->fuel_category_id)
            ->select('id as value', 'name as label', 'price')
            ->get()
            ->map(function ($fuelType) {
                $fuelType->price = round($fuelType->price);
                return $fuelType;
            });

        return response()->json([
            'fuelTypes' => $fuelTypes,
            'fuelCategoryId' => $vehicle->fuel_category_id
        ]);
    }

    /**
     * Get price for a specific fuel type
     */
    public function getFuelTypePrice($fuel_type_id)
    {
        $fuelType = FuelType::where('id', $fuel_type_id)->first();

        if (!$fuelType) {
            return response()->json(['error' => 'Fuel type not found'], 404);
        }

        return response()->json([
            'price' => round($fuelType->price)
        ]);
    }

    /**
     * Get current VAT percentage
     */
    public function getCurrentVat()
    {
        $vatPercentage = Vat::getCurrentVatPercentage();

        return response()->json([
            'vatPercentage' => $vatPercentage
        ]);
    }

    /**
     * Store a new daily invoice
     */
    public function storeInvoice(Request $request)
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

        $invoice = InvoiceDaily::create([
            'serial_no' => $request->serial_no,
            'date_added' => $request->date_added,
            'vehicle_id' => $request->vehicle_id,
            'fuel_type_id' => $request->fuel_type_id,
            'volume' => $request->volume,
            'fuel_net_price' => $request->fuel_net_price,
            'sub_total' => $request->sub_total,
            'vat_percentage' => $request->vat_percentage,
            'vat_amount' => $request->vat_amount,
            'Total' => $request->total,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invoice saved successfully',
            'invoice_id' => $invoice->id
        ], 201);
    }

}
