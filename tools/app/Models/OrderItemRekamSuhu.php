<?php

// File: app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItemRekamSuhu extends Model
{
    use HasFactory;
    use SoftDeletes;
    
    protected $fillable = ['order_item_id', 'tanggal', 'jam_data'];

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    // Cast kolom JSON ke array otomatis
    protected $casts = [
        'jam_data' => 'array',  // atau 'json':contentReference[oaicite:13]{index=13}
    ];
}
