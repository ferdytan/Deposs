<?php

// File: database/seeders/UserSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
class UserSeeder extends Seeder
{
    public function run()
    {
        $superUserRole = \App\Models\Role::where('name', 'Super User')->first();


         User::factory()->create([
           'name' => 'Super Admin', // Tambahkan field ini
            'username' => 'superadmin',
            'email' => 'superadmin@deposs.com',
            'password' => Hash::make('123123123'),
            'role_id' => $superUserRole->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

    }
}