<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuneralPackage extends Model
{
    protected $fillable = [
        'code', 'name', 'category', 'description', 'base_price',
        'includes', 'active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'integer',
            'includes' => 'array',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class);
    }
}
