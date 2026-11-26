<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Reservation extends Model
{
    protected $fillable = [
        'folio', 'product_id', 'customer_name', 'customer_email',
        'total_value', 'paid_amount', 'status', 'notes',
    ];

    protected $appends = ['pending'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(CatalogItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ReservationPayment::class)->orderBy('paid_on');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function getPendingAttribute(): int
    {
        return max(0, $this->total_value - $this->paid_amount);
    }
}
