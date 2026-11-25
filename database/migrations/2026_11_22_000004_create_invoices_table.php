<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('folio')->unique();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->date('issue_date');
            $table->unsignedInteger('net_amount')->default(0);
            $table->unsignedInteger('iva_amount')->default(0);
            $table->unsignedInteger('afp_discount')->default(0);
            $table->unsignedInteger('family_copay')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->boolean('email_sent')->default(false);
            $table->timestamps();
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('subtotal')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');
    }
};
