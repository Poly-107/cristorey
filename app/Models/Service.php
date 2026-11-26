<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $fillable = [
        'code', 'service_date', 'deceased_name', 'contractor_name',
        'contractor_email', 'product_id', 'funeral_package_id', 'quote_id',
        'viewing_room', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return ['service_date' => 'date'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(CatalogItem::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(FuneralPackage::class, 'funeral_package_id');
    }

    public function quote(): BelongsTo
    {
        return $this->belongsTo(Quote::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(CalendarEvent::class);
    }
}
