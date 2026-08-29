<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'embedding'];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function listings()
    {
        return $this->hasMany(Listing::class);
    }
}