<?php
// File: 2024_03_15_000006_create_orders_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_id')->nullable()->unique();      // Kode unik order, ex: ORD-20250731-0001
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('shipper_id')->nullable();
            $table->string('no_aju')->nullable();
            $table->string('deleted_reason')->nullable();
            $table->text('fumigasi')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
        });

    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
};