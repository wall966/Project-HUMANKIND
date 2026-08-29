<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Participation extends Model
{
    protected $fillable = ['listing_id', 'user_id', 'comment', 'status'];

    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}