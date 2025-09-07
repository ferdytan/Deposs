<?php

// File: app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    
    protected $fillable = [
        'order_id', 'product_id', 'container_number',
        'entry_date', 'eir_date', 'exit_date',
        'commodity', 'country', 'vessel',
        'price_type', 'price_value', 'delete_reason'
    ];

     protected $dates = [
        'entry_date',
    ];

    // Route Model Binding menggunakan field yang benar
    public function getRouteKeyName()
    {
        return 'id'; // atau field lain jika perlu
    }
    

    // OrderItem belongs to an Order
    public function order()
    {
        return $this->belongsTo(Order::class)->withTrashed();
    }


    // Layanan utama produk (Product model)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Produk tambahan (many-to-many ke Product via pivot)
    public function additionalProducts()
    {
        return $this->belongsToMany(Product::class, 'order_item_additional_products', 
                                    'order_item_id', 'product_id')
                    ->withPivot('price_value')->withTimestamps();
        // Menggunakan table pivot kustom 'order_item_additional_products' dan kolom kunci kustom:contentReference[oaicite:5]{index=5}:contentReference[oaicite:6]{index=6}.
        // withPivot agar kolom ekstra (price_value) bisa diakses:contentReference[oaicite:7]{index=7}.
    }

    // Catatan suhu (one-to-many)
    public function rekamSuhu()
    {
        return $this->hasMany(OrderItemRekamSuhu::class, 'order_item_id');
    }

    
}
