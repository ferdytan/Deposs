<?php

// app/Models/InvoiceItem.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InvoiceItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'order_item_id',
        'product_id',
        'container_number',
        'price_type',
        'price_value',
        'additional_products',
        'quantity'
    ];

    protected $casts = [
        'additional_products' => 'array',
        'price_value' => 'float',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }



    // Kembalikan additional_products sebagai koleksi (tanpa mengandalkan $casts)
    public function additionalProductsCollection()
    {
        $raw = $this->additional_products;

        // jika sudah array → bungkus ke koleksi; jika string JSON → decode
        if (is_string($raw)) {
            $decoded = json_decode($raw, true) ?: [];
            return collect($decoded);
        }
        return collect($raw ?? []);
    }

    // Jumlahkan qty additional pada item ini
    public function additionalQuantitySum(): int
    {
        return $this->additionalProductsCollection()->sum(function ($ap) {
            // dukung dua bentuk: ap['pivot']['quantity'] atau ap['quantity']
            return (int) ($ap['pivot']['quantity'] ?? $ap['quantity'] ?? 1);
        });
    }

    // Total nilai additional pada item ini (harga × qty), jika butuh di server-side
    public function additionalValueSum(): int
    {
        return $this->additionalProductsCollection()->sum(function ($ap) {
            $price = (int) ($ap['pivot']['price_value'] ?? $ap['price_value'] ?? 0);
            $qty   = (int) ($ap['pivot']['quantity']    ?? $ap['quantity']    ?? 1);
            return $price * $qty;
        });
    }

}
