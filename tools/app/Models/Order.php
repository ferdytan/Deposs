<?php

// File: app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $primaryKey = 'id'; // Pastikan ini benar
    public $incrementing = true;  // Pastikan ini true
    protected $keyType = 'int';   // Pastikan ini int
    
    // File: app/Models/Order.php
    protected $fillable = [
        'order_id',
        'customer_id',
        'shipper_id',
        'no_aju',
        'deleted_reason',
        'fumigasi', // Tambahkan field fumigasi di sini
    ];  

    protected $dates = ['deleted_at', 'entry_date', 'eir_date', 'exit_date'];

     // Relasi ke OrderItem (One-to-Many)
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }


    // Relasi ke Shipper (Many-to-One)
    public function shipper()
    {
        return $this->belongsTo(Shipper::class);
    }

    protected $casts = [
        'entry_date' => 'datetime',
        'eir_date' => 'datetime',
        'exit_date' => 'datetime',
    ];
    // public function customer()
    // {
    //     // ambil juga customer yang sudah di-soft-delete
    //     return $this->belongsTo(Customer::class)->withTrashed();
    // }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }


        public function product()
    {
        // ambil produk walau sudah soft-delete
        return $this->belongsTo(Product::class)->withTrashed();
    }

    
    

    // public function additionalProducts()
    // {
    //     return $this->hasMany(OrderAdditionalProduct::class);
    // }

    // app/Models/Order.php
    // public function additionalProducts()
    // {
    //     return $this->belongsToMany(Product::class, 'order_additional_products')
    //         ->withPivot('price_value');
    // }

    public function additionalProducts()
    {
        return $this->hasMany(OrderAdditionalProduct::class);
    }


    // File: app/Models/Order.php
    public function invoices()
    {
        // pivot defaultnya 'invoice_order'; ganti jika Anda memakai nama lain
        return $this->belongsToMany(Invoice::class, 'invoice_order');
    }


    public function temperatureRecords()
    {
        return $this->hasMany(\App\Models\TemperatureRecord::class, 'id_order');
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
// Order.php
public function order_items()
{
    return $this->hasMany(OrderItem::class);
}


}