<?php
// File: 2024_03_15_000006_create_order_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->string('container_number');
            $table->dateTime('entry_date')->nullable();
            $table->dateTime('eir_date')->nullable();
            $table->dateTime('exit_date')->nullable();
            $table->string('commodity')->nullable();
            $table->string('country')->nullable();
            $table->string('vessel')->nullable();
            $table->enum('price_type', ['20ft','40ft','global'])->nullable();
            $table->decimal('price_value', 12, 2)->nullable();
            $table->string('delete_reason')->nullable();
            $table->softDeletes();

            $table->timestamps();
            // Indeks unik: kombinasi order dan nomor kontainer harus unik 
            $table->unique(['order_id', 'container_number']);
        });

    }

    public function down()
    {
        Schema::dropIfExists('order_items');
    }
};