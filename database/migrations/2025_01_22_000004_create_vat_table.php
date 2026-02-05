<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vat', function (Blueprint $table) {
            $table->id();
            $table->double('vat_percentage')->default(0);
            $table->date('from_date')->nullable();
            $table->date('to_date')->default('2100-01-01');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vat');
    }
};
