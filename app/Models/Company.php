<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;

class Company extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'company';
    protected $primaryKey = 'id';

    protected $fillable = [
        'name',
        'nick_name',
        'address',
        'vat_no',
        'contact_number',
        'created_at',
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get all active companies
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Get vehicles for this company
     */
    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class, 'company_id', 'id');
    }

    /**
     * Get all active companies with caching
     */
    public static function getActiveCompanies()
    {
        return Cache::remember('active_companies', now()->addHours(6), function () {
            return self::whereNull('deleted_at')
                ->select('id as value', 'name as label')
                ->get();
        });
    }

    /**
     * Clear company cache when model is modified
     */
    protected static function booted(): void
    {
        static::saved(fn() => Cache::forget('active_companies'));
        static::deleted(fn() => Cache::forget('active_companies'));
    }
}
