<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $fillable = ['user_id', 'category_id', 'title', 'description', 'embedding', 'location', 'date_time'];

    protected $casts = [
        'embedding' => 'array',
        'date_time' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function participations()
    {
        return $this->hasMany(Participation::class);
    }
}