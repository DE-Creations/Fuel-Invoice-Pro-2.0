<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DailyInvoiceController;
use App\Http\Controllers\ManageInvoiceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\CashSaleController;
use App\Http\Controllers\ClientDetailsController;
use App\Http\Controllers\TaxInvoiceController;
use App\Http\Controllers\TaxInvoiceHistoryController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Authentication Routes
Route::get('/login', fn () => Inertia::render('Login'))->name('login');
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'name' => ['required', 'string'],
        'password' => ['required', 'string'],
    ]);

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
        $request->session()->regenerate();
        return redirect()->intended(route('dashboard'));
    }

    return back()->withErrors([
        'name' => 'Invalid credentials.',
    ])->onlyInput('name');
})->name('login.store');

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('home');
})->name('logout');

// Main Application Routes
Route::get('/', [DailyInvoiceController::class, 'index'])->name('home');
Route::get('/dashboard', [DailyInvoiceController::class, 'index'])->name('dashboard');
Route::get('/manage', [ManageInvoiceController::class, 'index'])->name('manage');
Route::get('/tax-invoice', [TaxInvoiceController::class, 'index'])->name('tax-invoice');
Route::get('/history', [TaxInvoiceHistoryController::class, 'index'])->name('history');
Route::get('/cash-sale', [CashSaleController::class, 'index'])->name('cash-sale');
Route::get('/clients', [ClientDetailsController::class, 'index'])->name('clients');
Route::get('/settings', [SettingsController::class, 'index'])->name('settings');

// API Routes for Invoice Form
Route::prefix('api/invoice')->group(function () {
    Route::get('/vehicles/{company_id}', [DailyInvoiceController::class, 'getVehiclesByCompany'])->name('api.vehicles');
    Route::get('/fuel-types/{vehicle_id}', [DailyInvoiceController::class, 'getFuelTypesByVehicle'])->name('api.fuel-types');
    Route::get('/fuel-price/{fuel_type_id}', [DailyInvoiceController::class, 'getFuelTypePrice'])->name('api.fuel-price');
    Route::get('/vat', [DailyInvoiceController::class, 'getCurrentVat'])->name('api.vat');
    Route::post('/store', [DailyInvoiceController::class, 'storeInvoice'])->name('api.invoice.store');
    Route::get('/list', [ManageInvoiceController::class, 'getInvoices'])->name('api.invoice.list');
    Route::get('/details/{id}', [ManageInvoiceController::class, 'getInvoiceDetails'])->name('api.invoice.details');
    Route::put('/update/{id}', [ManageInvoiceController::class, 'updateInvoice'])->name('api.invoice.update');
    Route::delete('/delete/{id}', [ManageInvoiceController::class, 'deleteInvoice'])->name('api.invoice.delete');
    Route::get('/deleted-list', [ManageInvoiceController::class, 'getDeletedInvoices'])->name('api.invoice.deleted-list');
    Route::post('/recover/{id}', [ManageInvoiceController::class, 'recoverInvoice'])->name('api.invoice.recover');

    // Backward compatibility - redirect to TaxInvoiceController
    Route::post('/tax-records', [TaxInvoiceController::class, 'getTaxInvoiceRecords'])->name('api.invoice.tax-records');
    Route::get('/next-tax-invoice-number/{company_id}', [TaxInvoiceController::class, 'getNextTaxInvoiceNumber'])->name('api.invoice.next-tax-number');
    Route::get('/payment-methods', [TaxInvoiceController::class, 'getPaymentMethods'])->name('api.invoice.payment-methods');
    Route::post('/generate-tax-invoice-pdf', [TaxInvoiceController::class, 'generateTaxInvoicePDF'])->name('api.invoice.generate-tax-pdf');
});

// API Routes for Settings
Route::prefix('api/settings')->group(function () {
    Route::post('/update-vat', [SettingsController::class, 'updateVat'])->name('api.settings.update-vat');
    Route::post('/update-fuel-price', [SettingsController::class, 'updateFuelPrice'])->name('api.settings.update-fuel-price');
    Route::post('/update-company', [SettingsController::class, 'updateCompany'])->name('api.settings.update-company');
});

// API Routes for Invoice History (backward compatibility)
Route::prefix('api/history')->group(function () {
    Route::post('/tax-invoices', [TaxInvoiceHistoryController::class, 'getTaxInvoices'])->name('api.history.tax-invoices');
    Route::post('/tax-invoice-records', [TaxInvoiceHistoryController::class, 'getTaxInvoiceRecords'])->name('api.history.tax-invoice-records');
    Route::post('/generate-tax-invoice-pdf', [TaxInvoiceHistoryController::class, 'generateTaxInvoicePDF'])->name('api.history.generate-tax-invoice-pdf');
});

// API Routes for Tax Invoice (New dedicated routes)
Route::prefix('api/tax-invoice')->group(function () {
    // For creating new tax invoices
    Route::post('/records', [TaxInvoiceController::class, 'getTaxInvoiceRecords'])->name('api.tax-invoice.records');
    Route::get('/next-number/{company_id}', [TaxInvoiceController::class, 'getNextTaxInvoiceNumber'])->name('api.tax-invoice.next-number');
    Route::post('/generate-pdf', [TaxInvoiceController::class, 'generateTaxInvoicePDF'])->name('api.tax-invoice.generate-pdf');
});

// API Routes for Tax Invoice History
Route::prefix('api/tax-invoice-history')->group(function () {
    Route::post('/list', [TaxInvoiceHistoryController::class, 'getTaxInvoices'])->name('api.tax-invoice-history.list');
    Route::post('/records', [TaxInvoiceHistoryController::class, 'getTaxInvoiceRecords'])->name('api.tax-invoice-history.records');
    Route::post('/generate-pdf', [TaxInvoiceHistoryController::class, 'generateTaxInvoicePDF'])->name('api.tax-invoice-history.generate-pdf');
});

// API Routes for Cash Sale
Route::prefix('api/cash-sale')->group(function () {
    Route::post('/store', [CashSaleController::class, 'store'])->name('api.cash-sale.store');
    Route::post('/show', [CashSaleController::class, 'show'])->name('api.cash-sale.show');
    Route::post('/generate-pdf', [CashSaleController::class, 'generatePDF'])->name('api.cash-sale.generate-pdf');
});

// API Routes for Client Details
Route::prefix('api/clients')->group(function () {
    Route::post('/vehicles', [ClientDetailsController::class, 'getVehicles'])->name('api.clients.vehicles');
    Route::post('/store-company', [ClientDetailsController::class, 'storeCompany'])->name('api.clients.store-company');
    Route::post('/store-vehicle', [ClientDetailsController::class, 'storeVehicle'])->name('api.clients.store-vehicle');
    Route::delete('/delete-company/{id}', [ClientDetailsController::class, 'deleteCompany'])->name('api.clients.delete-company');
    Route::delete('/delete-vehicle/{id}', [ClientDetailsController::class, 'deleteVehicle'])->name('api.clients.delete-vehicle');
});

Route::fallback(fn () => Inertia::render('NotFound'));

