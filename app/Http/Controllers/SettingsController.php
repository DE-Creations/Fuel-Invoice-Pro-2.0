<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use App\Models\Vat;
use App\Models\FuelType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Display the settings page
     */
    public function index()
    {
        // Get company details from settings table
        $settings = Settings::first();

        // Get latest VAT record
        $latestVat = Vat::orderBy('id', 'desc')->first();

        // Get all fuel types with prices
        $fuelTypes = FuelType::select('id', 'name', 'price')
            ->get()
            ->map(function ($fuelType) use ($latestVat) {
                $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;
                $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
                $vatAmount = $fuelType->price - $netPrice;

                return [
                    'id' => $fuelType->id,
                    'name' => $fuelType->name,
                    'price' => round($fuelType->price),
                    'netPrice' => round($netPrice),
                    'vatAmount' => round($vatAmount),
                ];
            });

        return Inertia::render('Settings', [
            'companyDetails' => [
                'name' => $settings->company_name ?? '',
                'address' => $settings->company_address ?? '',
                'contact' => $settings->company_contact ?? '',
                'vatNo' => $settings->company_vat_no ?? '',
                'place_of_supply' => $settings->place_of_supply ?? '',
            ],
            'currentVat' => [
                'percentage' => $latestVat ? $latestVat->vat_percentage : 0,
                'fromDate' => $latestVat ? $latestVat->from_date->format('Y-m-d') : null,
                'toDate' => $latestVat ? $latestVat->to_date->format('Y-m-d') : null,
            ],
            'fuelTypes' => $fuelTypes,
        ]);
    }

    /**
     * Update VAT percentage
     */
    public function updateVat(Request $request)
    {
        $request->validate([
            'vat_percentage' => 'required|numeric|min:0|max:100',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
        ]);

        // Update the latest VAT record's to_date to now()
        $latestVat = Vat::orderBy('id', 'desc')->first();
        if ($latestVat) {
            $latestVat->to_date = now();
            $latestVat->save();
        }

        $vat = Vat::create([
            'vat_percentage' => $request->vat_percentage,
            'from_date' => $request->from_date,
            'to_date' => $request->to_date,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'VAT percentage updated successfully',
            'vat' => [
                'percentage' => $vat->vat_percentage,
                'fromDate' => $vat->from_date->format('Y-m-d'),
                'toDate' => $vat->to_date->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Update fuel price
     */
    public function updateFuelPrice(Request $request)
    {
        $request->validate([
            'fuel_type_id' => 'required|exists:fuel_type,id',
            'price' => 'required|numeric|min:0',
        ]);

        $fuelType = FuelType::find($request->fuel_type_id);

        // Get latest VAT record
        $latestVat = Vat::orderBy('from_date', 'desc')->first();
        $vatPercentage = $latestVat ? $latestVat->vat_percentage : 0;

        // Insert record into fuel_price_history before updating
        DB::table('fuel_price_history')->insert([
            'fuel_type_id' => $fuelType->id,
            'fuel_price' => $request->price,
            'vat_percentage' => $vatPercentage,
            'from_date' => now()->format('Y-m-d'),
            'to_date' => '2100-01-01',
        ]);

        // Update fuel type price
        $fuelType->price = $request->price;
        $fuelType->save();

        $netPrice = $fuelType->price / (1 + ($vatPercentage / 100));
        $vatAmount = $fuelType->price - $netPrice;

        return response()->json([
            'success' => true,
            'message' => 'Fuel price updated successfully',
            'fuelType' => [
                'id' => $fuelType->id,
                'name' => $fuelType->name,
                'price' => $fuelType->price,
                'netPrice' => round($netPrice),
                'vatAmount' => round($vatAmount),
            ],
        ]);
    }

    /**
     * Update company details
     */
    public function updateCompany(Request $request)
    {
        $request->validate([
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string',
            'company_contact' => 'nullable|string|max:45',
            'company_vat_no' => 'nullable|string|max:45',
        ]);

        $settings = Settings::first();
        if (!$settings) {
            $settings = Settings::create($request->all());
        } else {
            $settings->update($request->all());
        }

        return response()->json([
            'success' => true,
            'message' => 'Company details updated successfully',
            'companyDetails' => [
                'name' => $settings->company_name,
                'address' => $settings->company_address,
                'contact' => $settings->company_contact,
                'vatNo' => $settings->company_vat_no,
            ],
        ]);
    }
}
