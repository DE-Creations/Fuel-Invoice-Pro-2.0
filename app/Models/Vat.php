<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class Vat extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'vat';
    protected $primaryKey = 'id';

    protected $fillable = [
        'vat_percentage',
        'from_date',
        'to_date',
    ];

    protected $casts = [
        'vat_percentage' => 'double',
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    /**
     * Get the current active VAT percentage with caching
     */
    public static function getCurrentVatPercentage(): float
    {
        return Cache::remember('current_vat_percentage', now()->addDay(), function () {
            $today = Carbon::today();

            $vat = self::where('from_date', '<=', $today)
                ->where('to_date', '>=', $today)
                ->orderBy('from_date', 'desc')
                ->first();

            return $vat ? $vat->vat_percentage : 0.0;
        });
    }

    /**
     * Clear VAT cache when model is saved
     */
    protected static function booted(): void
    {
        static::saved(fn() => Cache::forget('current_vat_percentage'));
        static::deleted(fn() => Cache::forget('current_vat_percentage'));
    }
}
