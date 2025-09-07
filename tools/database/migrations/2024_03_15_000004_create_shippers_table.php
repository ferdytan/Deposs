<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('shippers', function (Blueprint $table) {
            $table->id();
            $table->string('name');                    // required (tidak nullable)
            $table->text('address')->nullable();       // boleh null
            $table->string('city')->nullable();        // boleh null
            $table->string('province')->nullable();    // boleh null
            $table->string('phone')->nullable();       // boleh null
            $table->string('email')->unique()->nullable(); // unique, tapi boleh null
            $table->timestamps();
            $table->softDeletes(); // sudah benar, letak tidak masalah
        });
    }

    public function down()
    {
        Schema::dropIfExists('shippers');
    }
};