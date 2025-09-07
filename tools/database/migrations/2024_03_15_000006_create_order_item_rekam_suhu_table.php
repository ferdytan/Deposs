<?php
// File: 2024_03_15_000006_create_order_items_table.php

// File: 2024_XX_XX_XXXXXX_create_order_item_rekam_suhu_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('order_item_rekam_suhus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->date('tanggal');
            $table->json('jam_data');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['order_item_id', 'tanggal']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('order_item_rekam_suhus');
    }
};