<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'folio', 'service_id', 'reservation_id', 'issue_date', 'net_amount', 'iva_amount',
        'afp_discount', 'family_copay', 'total', 'email_sent', 'voided_at', 'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'email_sent' => 'boolean',
            'voided_at' => 'datetime',
        ];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
