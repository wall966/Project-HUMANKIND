# Project HUMANKIND

> **Proof of Concept**: an app that connects people through shared activities, mutual help, and learning from one another.

HUMANKIND helps people who have free time and want to share it find each other. Someone can offer to spend an afternoon at the park, organize a group volunteering session, tell the story of a place, look for a travel companion, or simply say *"I want to practice English, I have one hour free."*

The goal is to help people try things they've always wanted to learn, get out of the house, and build connections across generations.

### Example activities

| Category | Examples |
|---|---|
| 🗣️ **Languages** | Practice English over a coffee, a French conversation exchange, help someone learn Portuguese |
| 🎓 **Learn a skill** | Cooking a family recipe, playing guitar, gardening, basic photography, using a smartphone |
| 🤝 **Good deeds** | Picking up litter on a beach, helping at a retirement home, doing groceries for an elderly neighbor |
| 🌳 **Outdoors & meetups** | An afternoon at the park, a group walk or hike, a picnic |
| 🏛️ **Culture & history** | Discovering the history of a place or neighborhood, visiting a museum together |
| ✈️ **Travel** | Finding a travel companion for the same destination |

An activity can come from either side: someone **offering** something (*"I can teach you how to bake bread on Saturday"*) or someone **looking** for something (*"I want to practice English, I have one hour free"*).

---

## Core concepts

- **Shared activities.** Users publish activities or requests, and others join them.
- **Flexible roles.** There is no fixed "teacher" or "student". Anyone can teach and learn at the same time, depending on their interests.
- **Browse by category.** Users find opportunities by browsing categories (e.g. *good deeds*, *languages*, *outdoors*) instead of scrolling through a social feed.
- **No built-in messaging.** Contact details are shared only after a participation is approved.
- **Multilingual.** Portuguese, English, and French are planned.

### Participation flow

```
Browse category → Open listing → "Participate" + short comment
        → Status: PENDING (shown in "My activities")
        → Listing creator approves
        → Participant receives the details (time, address, contact)
```

---

## Automatic categorization with AI

When a user creates a listing, they **don't pick a category**. The app reads the description and assigns the closest category automatically.

```
┌─────────────┐   description    ┌──────────────────────┐
│   Laravel   │ ───────────────▶ │  FastAPI (Python)    │
│     API     │ ◀─────────────── │  sentence-transformers│
└─────────────┘  384-dim vector  └──────────────────────┘
       │
       │ cosine similarity against each category's embedding
       ▼
  best matching category_id  →  saved with the listing
```

- The model is `paraphrase-multilingual-MiniLM-L12-v2`, so a description written in Portuguese, French, or English lands in the same category.
- Each category stores its own embedding, and the listing is assigned to the category with the highest **cosine similarity**.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | **React** (SPA consuming the Laravel API) *(in development)* |
| Backend API | **Laravel 12** (PHP 8.2) |
| Authentication | **Laravel Sanctum** (API tokens) |
| Database | **PostgreSQL** (hosted on Supabase) |
| Embedding service | **FastAPI** + **sentence-transformers** (Python) |

### Architecture

```
┌──────────────┐  REST + Bearer token  ┌──────────────┐   HTTP   ┌──────────────────┐
│ React (SPA)  │ ────────────────────▶ │ Laravel API  │ ───────▶ │ FastAPI          │
│  frontend    │ ◀──────────────────── │  + Sanctum   │ ◀─────── │ embedding service│
└──────────────┘         JSON          └──────┬───────┘          └──────────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ PostgreSQL   │
                                      │ (Supabase)   │
                                      └──────────────┘
```

### Repository structure

```
Project-HUMANKIND/
├── frontend/             # React app (coming soon)
├── humankind/            # Laravel REST API
│   ├── app/Http/Controllers/   # AuthController, ListingController
│   ├── app/Http/Requests/Auth/ # Login & Register validation
│   ├── app/Services/           # EmbeddingService (calls FastAPI + cosine similarity)
│   └── routes/api.php
└── embedding-service/    # Python microservice that turns text into embeddings
    └── main.py
```

---

## API endpoints

All endpoints are prefixed with `/api`. Send the `Accept: application/json` header on every request.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | – | Create an account and get a token |
| `POST` | `/login` | – | Log in and get a token |
| `GET` | `/user` | 🔒 | Get the authenticated user |
| `GET` | `/listings` | 🔒 | List all listings |
| `POST` | `/listings` | 🔒 | Create a listing (category assigned automatically) |

🔒 = requires `Authorization: Bearer <token>`

<details>
<summary>Example: register</summary>

```http
POST /api/register
Content-Type: application/json
Accept: application/json

{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "12345678",
  "password_confirmation": "12345678"
}
```

Response `201 Created`:

```json
{
  "user": { "id": 1, "name": "Jane", "email": "jane@example.com" },
  "token": "1|abc123..."
}
```
</details>

---

## Getting started

### Prerequisites
- PHP 8.2+ and Composer
- Python 3.10+
- A PostgreSQL database (e.g. a free Supabase project)

### 1. Embedding service (FastAPI)

```bash
cd embedding-service
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --port 8000
```

> The first start downloads the model and can take a minute or two. Wait for `Application startup complete`.

### 2. Laravel API

```bash
cd humankind
composer install
cp .env.example .env        # then fill in the DB_* variables
php artisan key:generate
php artisan migrate
php artisan serve --port=8080
```

The API is now available at `http://127.0.0.1:8080/api`.

---

## Roadmap

**Done**
- [x] Laravel API structure and database schema (users, categories, listings, participations)
- [x] FastAPI embedding microservice (multilingual model)
- [x] Automatic listing categorization with cosine similarity
- [x] Registration and login with Sanctum tokens
- [x] Protected listing routes linked to the authenticated user

**Next**
- [ ] Logout (token revocation)
- [ ] Participation flow: join a listing, pending/approved/rejected status, approval by the creator
- [ ] Category seeder with pre-computed embeddings
- [ ] Error handling when the embedding service is offline
- [ ] Feature tests (`Http::fake()` for the embedding service)
- [ ] React frontend
  - [ ] Register / login screens (token stored client-side, sent as `Bearer`)
  - [ ] Browse activities by category
  - [ ] Activity details and "Participate" button
  - [ ] "My activities" page with participation status (pending / approved)
  - [ ] Create a listing (offer or request)
- [ ] i18n (PT / EN / FR)

**Later (out of scope for the POC)**
- [ ] Trust and safety: user ratings and identity verification

---

## About

This is a learning project and a proof of concept, built step by step to practice Laravel, React, REST APIs, authentication, and integrating an AI microservice.

**Author:** Nogueira Wallace · [GitHub](https://github.com/wall966)
