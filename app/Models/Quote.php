<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Quote extends Model
{
    protected $fillable = [
        'folio', 'customer_name', 'customer_email', 'deceased_name',
        'service_date', 'funeral_package_id', 'status', 'total',
        'notes', 'contracted_at',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'total' => 'integer',
            'contracted_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(FuneralPackage::class, 'funeral_package_id');
    }

    public function service(): HasOne
    {
        return $this->hasOne(Service::class);
    }
}
