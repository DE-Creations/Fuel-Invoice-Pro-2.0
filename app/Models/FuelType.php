<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];



    /**
     * Get the fuel category for this type
     */
    public function fuelCategory()
    {
        return $this->belongsTo(FuelCategory::class, 'fuel_category_id', 'id');
    }

    public function getById($id)
    {
        return $this->where('fuel_type_id', $id)->first();
    }
}
