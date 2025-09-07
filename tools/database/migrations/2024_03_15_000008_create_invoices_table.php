<?php

// database/migrations/2024_08_06_000001_create_invoices_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->unsignedBigInteger('customer_id');
            $table->string('period_start');
            $table->string('period_end');
            $table->decimal('subtotal', 18, 2);
            $table->decimal('ppn', 18, 2);
            $table->decimal('materai', 18, 2)->default(0);
            $table->decimal('grand_total', 18, 2);
            $table->string('terbilang')->nullable();
            $table->string('status')->default('unpaid');
            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
        });
    }

    public function down()
    {
        Schema::dropIfExists('invoices');
    }
};
