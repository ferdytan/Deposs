<?php
// File: database/seeders/RoleSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            'Super User' => [
                'access_all' => true,
                'manage_users' => true,
                'manage_masters' => true,
                'manage_orders' => true,
                'view_full_dashboard' => true
            ],
            'Admin' => [
                'access_all' => true,
                'manage_orders' => true,
                'view_full_dashboard' => true
            ],
            'Checker' => [
                'data_entry' => true,
                'view_restricted_dashboard' => true
            ],
            'Karantina' => [
                'view_restricted_dashboard' => true
            ]
        ];

        foreach ($roles as $name => $permissions) {
            Role::updateOrCreate(['name' => $name], ['permissions' => $permissions]);
        }
    }
}