<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderAdditionalProduct extends Model
{
    use SoftDeletes;
    protected $table = 'order_additional_products';

    protected $fillable = ['order_id', 'product_id', 'price_value'];

    public $timestamps = true;

    public function product()
    {
        // ambil produk tambahan walau sudah soft-delete
        return $this->belongsTo(Product::class)->withTrashed();
    }

    
    
}
