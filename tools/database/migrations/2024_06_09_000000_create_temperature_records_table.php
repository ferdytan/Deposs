<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('temperature_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_order')->nullable(); // Tambahkan baris ini
            $table->unsignedBigInteger('produk_id');
            
            $table->string('nomor_kontainer');
            $table->date('record_date'); // NEW: tanggal pencatatan suhu

            // 24 kolom impout_00 .. impout_23
            for ($i = 0; $i < 24; $i++) {
                $table->float(sprintf('impout_%02d', $i))->nullable();
            }

            $table->timestamps();
            // Hindari duplikasi data per hari
            // $table->unique(['produk_id', 'nomor_kontainer', 'record_date']);
            // $table->unique(['id_order', 'nomor_kontainer', 'record_date'], 'unique_per_order_kontainer_date');

            // Foreign Key Constraint
            $table->foreign('id_order')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('temperature_records');
    }
};
