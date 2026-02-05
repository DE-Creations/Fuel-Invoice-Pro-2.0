<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'company_id', 'id');
    }
}
