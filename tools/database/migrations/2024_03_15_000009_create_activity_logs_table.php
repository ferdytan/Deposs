<?php
// File: 2024_03_15_000009_create_activity_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('action'); // Contoh: "Update Tanggal EIR"
            $table->string('model_type'); // Model yang diubah (Order, Invoice, dll)
            $table->unsignedBigInteger('model_id'); // ID record yang diubah
            $table->json('old_values')->nullable(); // Data sebelum perubahan
            $table->json('new_values')->nullable(); // Data setelah perubahan
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_logs');
    }
};