<?php

// File: 2024_03_15_000005_create_products_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('service_type');
            $table->text('description')->nullable();
            $table->softDeletes();
            
            // Mengganti boolean dengan tinyInteger
            $table->tinyInteger('requires_temperature')->default(0);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('products');
    }
};