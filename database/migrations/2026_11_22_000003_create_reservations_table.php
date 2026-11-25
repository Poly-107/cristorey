<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->foreignId('product_id')->constrained('catalog_items')->cascadeOnDelete();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->unsignedInteger('total_value')->default(0);
            $table->unsignedInteger('paid_amount')->default(0);
            $table->string('status')->default('Reservado/Abonado');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('reservation_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->date('paid_on');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_payments');
        Schema::dropIfExists('reservations');
    }
};
