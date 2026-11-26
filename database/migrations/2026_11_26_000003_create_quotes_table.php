<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotes', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('deceased_name')->nullable();
            $table->date('service_date')->nullable();
            $table->foreignId('funeral_package_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->string('status')->default('Cotizada');
            $table->unsignedInteger('total')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('contracted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quote_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quote_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('subtotal')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_items');
        Schema::dropIfExists('quotes');
    }
};
