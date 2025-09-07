<?php 

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shipper extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'address',
        'city',
        'province',
        'phone',
        'email'
    ];
}