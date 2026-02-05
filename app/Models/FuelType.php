<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class FuelType extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'fuel_type';
    protected $primaryKey = 'id';

    protected $fillable = [
        'fuel_category_id',
        'name',
        'price',
    ];

    protected $casts = [
        'price' => 'double',
        'fuel_category_id' => 'integer',
    ];

    /**
     * Get the fuel category for this type
     */
    public function fuelCategory(): BelongsTo
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }

    /**
     * Get fuel type by ID
     */
    public function getById($id)
    {
        return $this->where('fuel_type_id', $id)->first();
    }

    /**
     * Clear fuel type cache when model is modified
     */
    protected static function booted(): void
    {
        static::saved(function ($fuelType) {
            Cache::forget("fuel_types_category_{$fuelType->fuel_category_id}");
        });
        static::deleted(function ($fuelType) {
            Cache::forget("fuel_types_category_{$fuelType->fuel_category_id}");
        });
    }
}
