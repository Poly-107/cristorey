<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->date('service_date');
            $table->string('deceased_name');
            $table->string('contractor_name')->nullable();
            $table->string('contractor_email')->nullable();
            $table->foreignId('product_id')->nullable()->constrained('catalog_items')->nullOnDelete();
            $table->string('viewing_room')->nullable();
            $table->string('status')->default('En curso');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
