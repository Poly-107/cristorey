<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('service_id')->nullable()->change();
            $table->foreignId('reservation_id')
                ->nullable()
                ->after('service_id')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        // No revertimos service_id a NOT NULL: puede haber boletas emitidas desde reserva.
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
            $table->dropColumn('reservation_id');
        });
    }
};
