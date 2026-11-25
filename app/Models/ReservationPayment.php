<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationPayment extends Model
{
    protected $fillable = ['reservation_id', 'amount', 'paid_on', 'note'];

    protected function casts(): array
    {
        return ['paid_on' => 'date'];
    }

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }
}
