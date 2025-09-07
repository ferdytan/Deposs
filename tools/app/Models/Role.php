<?php
// app/Models/Role.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'permissions'];

    protected $casts = [
        'permissions' => 'array'
    ];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function mount()
    {
        $this->roles = Role::where('name', '!=', 'super_user')->get();
    }

    
}
