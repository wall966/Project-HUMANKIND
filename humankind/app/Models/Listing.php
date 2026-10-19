<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $fillable = [
        'user_id', 'category_id', 'title', 'description', 'embedding',
        'location', 'latitude', 'longitude', 'date_time', 'address', 'contact_phone',
    ];

    // Jamais dans le JSON par défaut : l'embedding (384 nombres) et les informations privées.
    // L'adresse et le téléphone ne seront révélés qu'aux participants validés.
    protected $hidden = ['embedding', 'address', 'contact_phone'];

    protected $casts = [
        'embedding' => 'array',
        'date_time' => 'datetime',
        // DECIMAL est renvoyé comme texte ("43.611000") : on le convertit en nombre
        'latitude' => 'float',
        'longitude' => 'float',
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