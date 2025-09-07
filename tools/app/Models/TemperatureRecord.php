<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemperatureRecord extends Model
{
    protected $table = 'temperature_records';

    protected $fillable = [
        'id_order',
        'produk_id',
        'nomor_kontainer',
        // impout_00 ... impout_23
        // Gunakan array_map untuk generate
        // 'impout_00', ..., 'impout_23'
    ];

    // Tambahkan fillable impout_00 ... impout_23
    protected $casts = [
        'impout_00' => 'float',
        'impout_01' => 'float',
        'impout_02' => 'float',
        'impout_03' => 'float',
        'impout_04' => 'float',
        'impout_05' => 'float',
        'impout_06' => 'float',
        'impout_07' => 'float',
        'impout_08' => 'float',
        'impout_09' => 'float',
        'impout_10' => 'float',
        'impout_11' => 'float',
        'impout_12' => 'float',
        'impout_13' => 'float',
        'impout_14' => 'float',
        'impout_15' => 'float',
        'impout_16' => 'float',
        'impout_17' => 'float',
        'impout_18' => 'float',
        'impout_19' => 'float',
        'impout_20' => 'float',
        'impout_21' => 'float',
        'impout_22' => 'float',
        'impout_23' => 'float',
    ];

    public function product()
    {
        return $this->belongsTo(\App\Models\Product::class, 'produk_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'id_order');
    }


}
