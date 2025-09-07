<?php
// File: 2024_03_15_000006_create_order_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('order_item_additional_products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');

            $table->unsignedBigInteger('product_id');
            $table->decimal('price_value', 12, 2)->nullable();
            $table->timestamps();
            $table->unique(['order_item_id', 'product_id']);
            $table->softDeletes();

        });

    }

    public function down()
    {
        Schema::dropIfExists('order_item_additional_products');
    }
};