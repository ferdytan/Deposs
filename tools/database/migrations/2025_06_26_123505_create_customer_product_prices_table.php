<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('customer_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('custom_price_20ft', 12, 0)->nullable();
            $table->decimal('custom_price_40ft', 12, 0)->nullable();
            $table->decimal('custom_global_price', 12, 0)->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('customer_product');
    }
};