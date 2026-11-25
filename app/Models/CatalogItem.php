<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class CatalogItem extends Model
{
    protected $fillable = [
        'name', 'category', 'length_cm', 'width_cm', 'height_cm', 'material',
        'price_clp', 'stock', 'reference_url', 'image_path', 'active',
    ];

    protected $appends = ['image_url'];

    protected function casts(): array
    {
        return ['active' => 'boolean'];
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function dimensions(): string
    {
        return "{$this->length_cm} x {$this->width_cm} x {$this->height_cm} cm";
    }

    protected function imageUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->image_path) {
                return null;
            }

            if (str_starts_with($this->image_path, 'http')) {
                return $this->image_path;
            }

            if (config('filesystems.default') === 's3') {
                return Storage::disk('s3')->url($this->image_path);
            }

            return '/'.ltrim($this->image_path, '/');
        });
    }
}
