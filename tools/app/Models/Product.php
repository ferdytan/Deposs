<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;
    protected $dates = ['deleted_at'];

    protected $fillable = [
        'service_type',
        'tariff_20ft',
        'tariff_40ft',
        'description',
        'requires_temperature'
    ];

    public function customers()
    {
        return $this->belongsToMany(Customer::class, 'customer_product')
                    ->withPivot([
                        'custom_price_20ft',
                        'custom_price_40ft',
                        'custom_global_price'
                    ])
                    ->withTimestamps();
    }
}