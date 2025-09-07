<?php

// app/Models/Invoice.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'customer_id',
        'period_start',
        'period_end',
        'subtotal',
        'ppn',
        'materai',
        'grand_total',
        'terbilang',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }







    // Ambil item beserta product (untuk tampilan)
    public function itemsWithProduct()
    {
        return $this->hasMany(\App\Models\InvoiceItem::class)->with('product');
    }

    // Ambil item beserta order (lewat orderItem → order)
    public function itemsWithOrder()
    {
        return $this->hasMany(\App\Models\InvoiceItem::class)->with(['orderItem.order']);
    }

    // Ambil satu Order pertama yang terkait invoice (untuk header "No Order/AJU")
    public function firstOrder()
    {
        // BUKAN relasi native; tetap method helper agar aman dipakai di controller
        $firstItem = $this->itemsWithOrder()->first();
        return optional(optional($firstItem)->orderItem)->order;
    }

    // Scope util untuk payload show/preview (memudahkan controller)
    public function scopeWithShowPayload($query)
    {
        return $query->with([
            'customer:id,name',
            'itemsWithProduct',          // item + product
            'itemsWithOrder',            // item + order (via orderItem)
        ]);
    }

    // Hitung total qty additional untuk seluruh item invoice (buat index.tsx kolom Qty Additional)
    public function additionalQtyTotal(): int
    {
        // gunakan helper di InvoiceItem (lihat di bawah)
        return $this->items->sum(function ($it) {
            return method_exists($it, 'additionalQuantitySum')
                ? $it->additionalQuantitySum()
                : 0;
        });
    }

}
