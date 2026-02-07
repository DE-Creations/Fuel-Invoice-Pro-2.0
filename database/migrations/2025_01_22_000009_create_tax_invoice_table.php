<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tax_invoice', function (Blueprint $table) {
            $table->id();
            $table->string('tax_invoice_no', 45)->nullable();
            $table->dateTime('invoice_date')->nullable();
            $table->string('company_name', 255)->nullable();
            $table->string('vehicle_no', 255)->nullable();
            $table->unsignedBigInteger('payment_method_id')->default(1);
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();
            $table->decimal('subtotal', 15)->default(0);
            $table->decimal('vat_percentage', 5)->default(0);
            $table->decimal('vat_amount', 15)->default(0);
            $table->decimal('total_amount', 15)->default(0);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('payment_method_id')
                ->references('id')
                ->on('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tax_invoice');
    }
};
