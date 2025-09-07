<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class CustomerProduct extends Pivot
{
    protected $table = 'customer_product';
}