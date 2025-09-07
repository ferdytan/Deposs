<?php

// database/migrations/2024_08_06_000002_create_invoice_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('invoice_id');
            $table->unsignedBigInteger('order_item_id'); // container yang ter-invoice
            $table->unsignedBigInteger('product_id');    // produk utama
            $table->string('container_number');
            $table->string('price_type')->nullable();     // 20ft, 40ft, global
            $table->decimal('price_value', 18, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->json('additional_products')->nullable();

            $table->timestamps();

            $table->foreign('invoice_id')->references('id')->on('invoices');
            $table->foreign('order_item_id')->references('id')->on('order_items');
            $table->foreign('product_id')->references('id')->on('products');
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoice_items');
    }
};
