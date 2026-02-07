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
use App\Http\Controllers\InvoiceSummaryController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Authentication Routes
Route::get('/login', fn () => Inertia::render('Login'))->name('login');
Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'name' => ['required', 'string'],
        'password' => ['required', 'string'],
    ]);

    // Find the user first
    $user = \App\Models\User::where('name', $credentials['name'])->first();

    // Check if user exists
    if (!$user) {
        return back()->withErrors([
            'name' => 'Invalid User Name',
        ])->onlyInput('name');
    }

    // Check if account has expired
    if ($user->expired_at && now()->isAfter($user->expired_at)) {
        return back()->withErrors([
            'name' => 'Your User Account has expired. Please contact the support team',
        ])->onlyInput('name');
    }

    // Check if remember token is expired (if exists)
    if ($user->remember_token && $user->remember_token_expires_at) {
        if (now()->isAfter($user->remember_token_expires_at)) {
            // Clear expired remember token
            $user->update([
                'remember_token' => null,
                'remember_token_expires_at' => null,
            ]);
        }
    }

    // Verify password
    if (!\Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
        return back()->withErrors([
            'password' => 'Password is Incorrect',
        ])->onlyInput('name');
    }

    // Login the user
    Auth::login($user, $request->boolean('remember'));
    $request->session()->regenerate();

    // If remember me is checked, set token expiration to 7 days
    if ($request->boolean('remember')) {
        $user->update([
            'remember_token_expires_at' => now()->addDays(7),
        ]);
    }

    return redirect()->intended(route('dashboard'));
})->name('login.store');

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect()->route('login');
})->name('logout');

// Main Application Routes (Protected by auth middleware)
Route::middleware(['auth'])->group(function () {
    Route::get('/', [DailyInvoiceController::class, 'index'])->name('home');
    Route::get('/dashboard', [DailyInvoiceController::class, 'index'])->name('dashboard');
    Route::get('/manage', [ManageInvoiceController::class, 'index'])->name('manage');
    Route::get('/tax-invoice', [TaxInvoiceController::class, 'index'])->name('tax-invoice');
    Route::get('/invoice-summary', [InvoiceSummaryController::class, 'index'])->name('invoice-summary');
    Route::get('/history', [TaxInvoiceHistoryController::class, 'index'])->name('history');
    Route::get('/cash-sale', [CashSaleController::class, 'index'])->name('cash-sale');
    Route::get('/clients', [ClientDetailsController::class, 'index'])->name('clients');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
});

// API Routes (Protected by auth middleware)
Route::middleware(['auth'])->group(function () {
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

    // API Routes for Invoice Summary
    Route::prefix('api/invoice-summary')->group(function () {
        Route::get('/search', [InvoiceSummaryController::class, 'search'])->name('api.invoice-summary.search');
        Route::get('/print', [InvoiceSummaryController::class, 'print'])->name('api.invoice-summary.print');
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
});

// Admin Routes (Protected by admin middleware)
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    // Web routes (Inertia pages)
    Route::get('/users', [UserController::class, 'index'])->name('admin.users.index');
    Route::get('/users/create', [UserController::class, 'create'])->name('admin.users.create');
    Route::post('/users', [UserController::class, 'store'])->name('admin.users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('admin.users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('admin.users.destroy');

    // API routes for AJAX requests
    Route::get('/api/users', [UserController::class, 'getUsers'])->name('admin.api.users.list');
});

Route::fallback(fn () => Inertia::render('NotFound'));

