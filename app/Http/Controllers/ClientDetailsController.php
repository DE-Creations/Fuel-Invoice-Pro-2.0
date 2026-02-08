<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Company;
use App\Models\FuelCategory;

class ClientDetailsController extends Controller
{
    /**
     * Display the client details page
     */
    public function index()
    {
        // Fetch all active companies using cached method
        $companies = Company::where(function($query) {
                $query->whereNull('deleted_at')
                      ->orWhere('deleted_at', '0000-00-00 00:00:00');
            })
            ->select(
                'id',
                'name as companyName',
                'nick_name as nickName',
                'address',
                'contact_number as contact',
                'vat_no as vatNo'
            )
            ->get();

        // Fetch fuel categories
        $fuelCategories = FuelCategory::getAllCategories();

        return Inertia::render('ClientDetails', [
            'companies' => $companies,
            'fuelCategories' => $fuelCategories,
        ]);
    }

    /**
     * Get vehicles for a specific company
     */
    public function getVehicles(Request $request)
    {
        $request->validate([
            'company_id' => 'required|integer',
        ]);

        $vehicles = DB::table('vehicle')
            ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
            ->where('vehicle.company_id', $request->company_id)
            ->whereNull('vehicle.deleted_at')
            ->select(
                'vehicle.id as id',
                'vehicle.company_id as companyId',
                'vehicle.vehicle_no as vehicleNo',
                'vehicle.type',
                'fuel_category.name as fuelCategory'
            )
            ->get();

        return response()->json([
            'success' => true,
            'vehicles' => $vehicles,
        ]);
    }

    /**
     * Store a new company
     */
    public function storeCompany(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'contact_number' => 'required|string|max:20',
            'vat_no' => 'required|string|max:50',
        ]);

        try {
            // Check for duplicate company name
            $existingCompanyByName = DB::table('company')
                ->where('name', $request->name)
                ->first();

            if ($existingCompanyByName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this name already exists.',
                ], 422);
            }

            // Check for duplicate nick name
            $existingCompanyByNickName = DB::table('company')
                ->where('nick_name', $request->nick_name)
                ->first();

            if ($existingCompanyByNickName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this nick name already exists.',
                ], 422);
            }

            // Check for duplicate VAT number
            $existingCompanyByVatNo = DB::table('company')
                ->where('vat_no', $request->vat_no)
                ->first();

            if ($existingCompanyByVatNo) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this VAT number already exists.',
                ], 422);
            }

            $companyId = DB::table('company')->insertGetId([
                'name' => $request->name,
                'nick_name' => $request->nick_name,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'vat_no' => $request->vat_no,
                'created_at' => now(),
            ]);

            $company = DB::table('company')
                ->where('id', $companyId)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Company created successfully.',
                'company' => [
                    'id' => $company->id,
                    'companyName' => $company->name,
                    'nickName' => $company->nick_name,
                    'address' => $company->address,
                    'contact' => $company->contact_number,
                    'vatNo' => $company->vat_no,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create company: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a new vehicle
     */
    public function storeVehicle(Request $request)
    {
        $request->validate([
            'company_id' => 'required|integer|exists:company,id',
            'vehicle_no' => 'required|string|max:15',
            'type' => 'required|string|max:50',
            'fuel_category_id' => 'required|integer|exists:fuel_category,id',
        ]);

        try {
            // Check for duplicate vehicle number
            $existingVehicle = DB::table('vehicle')
                ->where('vehicle_no', $request->vehicle_no)
                ->first();

            if ($existingVehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vehicle with this number already exists.',
                ], 422);
            }

            $vehicleId = DB::table('vehicle')->insertGetId([
                'company_id' => $request->company_id,
                'vehicle_no' => $request->vehicle_no,
                'type' => $request->type,
                'fuel_category_id' => $request->fuel_category_id,
                'created_at' => now(),
            ]);

            $vehicle = DB::table('vehicle')
                ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
                ->where('vehicle.id', $vehicleId)
                ->select(
                    'vehicle.id',
                    'vehicle.company_id',
                    'vehicle.vehicle_no',
                    'vehicle.type',
                    'fuel_category.name as fuel_category_name'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle created successfully.',
                'vehicle' => [
                    'id' => $vehicle->id,
                    'companyId' => $vehicle->company_id,
                    'vehicleNo' => $vehicle->vehicle_no,
                    'type' => $vehicle->type,
                    'fuelCategory' => $vehicle->fuel_category_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a company
     */
    public function updateCompany(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nick_name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'contact_number' => 'required|string|max:20',
            'vat_no' => 'required|string|max:50',
        ]);

        try {
            // Check if company exists
            $company = DB::table('company')->where('id', $id)->first();
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found.',
                ], 404);
            }

            // Check for duplicate company name (excluding current company)
            $existingCompanyByName = DB::table('company')
                ->where('name', $request->name)
                ->where('id', '!=', $id)
                ->first();

            if ($existingCompanyByName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this name already exists.',
                ], 422);
            }

            // Check for duplicate nick name (excluding current company)
            $existingCompanyByNickName = DB::table('company')
                ->where('nick_name', $request->nick_name)
                ->where('id', '!=', $id)
                ->first();

            if ($existingCompanyByNickName) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this nick name already exists.',
                ], 422);
            }

            // Check for duplicate VAT number (excluding current company)
            $existingCompanyByVatNo = DB::table('company')
                ->where('vat_no', $request->vat_no)
                ->where('id', '!=', $id)
                ->first();

            if ($existingCompanyByVatNo) {
                return response()->json([
                    'success' => false,
                    'message' => 'A company with this VAT number already exists.',
                ], 422);
            }

            DB::table('company')->where('id', $id)->update([
                'name' => $request->name,
                'nick_name' => $request->nick_name,
                'address' => $request->address,
                'contact_number' => $request->contact_number,
                'vat_no' => $request->vat_no,
            ]);

            $company = DB::table('company')
                ->where('id', $id)
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Company updated successfully.',
                'company' => [
                    'id' => $company->id,
                    'companyName' => $company->name,
                    'nickName' => $company->nick_name,
                    'address' => $company->address,
                    'contact' => $company->contact_number,
                    'vatNo' => $company->vat_no,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update company: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a vehicle
     */
    public function updateVehicle(Request $request, $id)
    {
        $request->validate([
            'company_id' => 'required|integer|exists:company,id',
            'vehicle_no' => 'required|string|max:15',
            'type' => 'required|string|max:50',
            'fuel_category_id' => 'required|integer|exists:fuel_category,id',
        ]);

        try {
            // Check if vehicle exists
            $vehicle = DB::table('vehicle')->where('id', $id)->first();
            if (!$vehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle not found.',
                ], 404);
            }

            // Check for duplicate vehicle number (excluding current vehicle)
            $existingVehicle = DB::table('vehicle')
                ->where('vehicle_no', $request->vehicle_no)
                ->where('id', '!=', $id)
                ->first();

            if ($existingVehicle) {
                return response()->json([
                    'success' => false,
                    'message' => 'A vehicle with this number already exists.',
                ], 422);
            }

            DB::table('vehicle')->where('id', $id)->update([
                'company_id' => $request->company_id,
                'vehicle_no' => $request->vehicle_no,
                'type' => $request->type,
                'fuel_category_id' => $request->fuel_category_id,
            ]);

            $vehicle = DB::table('vehicle')
                ->join('fuel_category', 'vehicle.fuel_category_id', '=', 'fuel_category.id')
                ->where('vehicle.id', $id)
                ->select(
                    'vehicle.id',
                    'vehicle.company_id',
                    'vehicle.vehicle_no',
                    'vehicle.type',
                    'fuel_category.name as fuel_category_name'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Vehicle updated successfully.',
                'vehicle' => [
                    'id' => $vehicle->id,
                    'companyId' => $vehicle->company_id,
                    'vehicleNo' => $vehicle->vehicle_no,
                    'type' => $vehicle->type,
                    'fuelCategory' => $vehicle->fuel_category_name,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a company (soft delete)
     */
    public function deleteCompany($id)
    {
        try {
            DB::beginTransaction();

            $updated = DB::table('company')
                ->where('id', $id)
                ->update(['deleted_at' => now()]);

            DB::table('vehicle')
                ->where('company_id', $id)
                ->update(['deleted_at' => now()]);

            DB::commit();

            if ($updated) {
                return response()->json([
                    'success' => true,
                    'message' => 'Company deleted successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found',
                ], 404);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete company: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a vehicle (soft delete)
     */
    public function deleteVehicle($id)
    {
        try {
            $updated = DB::table('vehicle')
                ->where('id', $id)
                ->update(['deleted_at' => now()]);

            if ($updated) {
                return response()->json([
                    'success' => true,
                    'message' => 'Vehicle deleted successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Vehicle not found',
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete vehicle: ' . $e->getMessage(),
            ], 500);
        }
    }
}
