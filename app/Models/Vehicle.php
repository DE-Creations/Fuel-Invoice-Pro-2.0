<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'vehicle';
    protected $primaryKey = 'id';

    protected $fillable = [
        'company_id',
        'vehicle_no',
        'type',
        'fuel_category_id',
        'created_at',
        'deleted_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get all active vehicles
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Get the company that owns the vehicle
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    /**
     * Get the fuel category for the vehicle
     */
    public function fuelCategory()
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }
}
