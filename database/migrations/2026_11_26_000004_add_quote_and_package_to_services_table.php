<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('funeral_package_id')
                ->nullable()
                ->after('product_id')
                ->constrained()
                ->nullOnDelete();
            $table->foreignId('quote_id')
                ->nullable()
                ->after('funeral_package_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropForeign(['funeral_package_id']);
            $table->dropForeign(['quote_id']);
            $table->dropColumn(['funeral_package_id', 'quote_id']);
        });
    }
};
