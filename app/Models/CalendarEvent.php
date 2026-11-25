<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    protected $fillable = [
        'title', 'type', 'event_date', 'start_time', 'end_time',
        'location', 'service_id', 'notes',
    ];

    protected function casts(): array
    {
        return ['event_date' => 'date'];
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
