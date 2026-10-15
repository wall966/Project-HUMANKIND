# Project HUMANKIND

> **Proof of Concept**: an app that connects people through shared activities, mutual help, and learning from one another.

HUMANKIND brings together people who have free time and want to **offer** it to others. Someone can offer to spend an afternoon at the park, organize a group volunteering session, tell the story of a place, share a skill, or simply say *"I can help you practice English, I have one hour free."*

The goal is to help people try things they've always wanted to learn, get out of the house, and build connections across generations.

---

## Preview

| Log in | Sign up |
|---|---|
| ![Log in page](img/log-in.png) | ![Sign up page](img/create-user.png) |

**Offer your help:** the form has a live preview, a city autocomplete limited to real places, and a private section (address, phone) shared only with approved participants. No category to pick: the AI finds it from the description.

![Create a listing page](img/form.png)

### Example activities

| Category | Examples |
|---|---|
| 🗣️ **Languages** | Practice English over a coffee, a French conversation exchange, help someone learn Portuguese |
| 🎓 **Learn a skill** | Cooking a family recipe, playing guitar, gardening, basic photography, using a smartphone |
| 🤝 **Good deeds** | Picking up litter on a beach, helping at a retirement home, doing groceries for an elderly neighbor |
| 🌳 **Outdoors & meetups** | An afternoon at the park, a group walk or hike, a picnic |
| 🏛️ **Culture & history** | Discovering the history of a place or neighborhood, visiting a museum together |
| ✈️ **Travel** | Finding a travel companion for the same destination |

Every listing is an **offer of help** (*"I can teach you how to bake bread on Saturday"*). HumanKind is built by people who are willing to give some of their time.

---

## Core concepts

- **Offers of help.** Users publish what they can offer, and others ask to join.
- **Flexible roles.** There is no fixed "teacher" or "student". Anyone can offer help on one topic and join someone else's activity on another.
- **AI-powered search.** Nobody picks a category: the AI assigns one when a listing is published, and finds the right one from what a user types in the search bar.
- **No built-in messaging.** Contact details are shared only after a participation is approved.
- **Multilingual.** Portuguese, English, and French are planned.

### Participation flow

```
Search → Open listing → "Participate" + short comment
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
| Frontend | **React 19** + **Vite** + **React Router** (SPA consuming the Laravel API) *(in development)* |
| Place search | **Photon** (OpenStreetMap), free and worldwide |
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
├── front-end/            # React app (Vite)
│   └── src/                    # Welcome (log in), Login (sign up), Formulaire (create a listing)
├── img/                  # Screenshots used in this README
├── humankind/            # Laravel REST API
│   ├── app/Http/Controllers/   # Auth, Listing, Category, Participation controllers
│   ├── app/Http/Requests/      # Form request validation (login, register, participation)
│   ├── app/Models/             # User, Listing, Category, Participation
│   ├── app/Services/           # EmbeddingService (calls FastAPI + cosine similarity)
│   └── routes/api.php
└── embedding-service/    # Python microservice that turns text into embeddings
    └── main.py
```

---

## API endpoints

All endpoints are prefixed with `/api`. Send the `Accept: application/json` header on every request.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | – | Create an account and get a token |
| `POST` | `/login` | – | Log in and get a token |
| `POST` | `/logout` | 🔒 | Revoke the current token |
| `GET` | `/user` | 🔒 | Get the authenticated user |

### Listings & categories

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/listings` | 🔒 | List all listings |
| `POST` | `/listings` | 🔒 | Create a listing (category assigned automatically by AI) |
| `GET` | `/listings/{listing}` | 🔒 | Listing details, with the creator's name and the category |
| `GET` | `/categories` | 🔒 | List all categories |
| `GET` | `/categories/{category}/listings` | 🔒 | Listings of a category |

### Participations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/listings/{listing}/participate` | 🔒 | Ask to join a listing (optional `comment`). Status starts as `pending` |
| `GET` | `/my-activities` | 🔒 | The user's participations, with their status and listing |
| `GET` | `/listings/{listing}/participations` | 🔒 👑 | Requests received for a listing (creator only) |
| `PATCH` | `/participations/{participation}` | 🔒 👑 | Approve or reject a request: `{ "status": "approved" \| "rejected" }` (creator only) |

🔒 = requires `Authorization: Bearer <token>` · 👑 = only the listing's creator

**Business rules**
- A user can't join their own listing → `403`
- A user can't join the same listing twice → `409`
- Only the listing's creator can see and answer its requests → `403`
- A request can only be answered once (it must still be `pending`) → `409`
- Requests only expose the participant's `id` and `name` (no email)

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
python -m uvicorn main:app --port 8001
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

### 3. React front-end

```bash
cd front-end
npm install
cp .env.example .env        # VITE_API_URL=http://127.0.0.1:8080/api
npm run dev
```

The app is now available at `http://localhost:5173`.

---

## Roadmap

**Done**
- [x] Laravel API structure and database schema (users, categories, listings, participations)
- [x] FastAPI embedding microservice (multilingual model)
- [x] Automatic listing categorization with cosine similarity
- [x] Registration and login with Sanctum tokens
- [x] Protected listing routes linked to the authenticated user
- [x] Logout (token revocation)
- [x] Listing details and browsing by category
- [x] Participation flow: join a listing (pending), "my activities", creator sees and approves/rejects requests
- [x] Business rules (no self-participation, no duplicates, creator-only approval)

**Next**
- [ ] Share the listing's details (time, address, contact) only with approved participants
- [ ] Category seeder with pre-computed embeddings
- [ ] Error handling when the embedding service is offline
- [ ] Feature tests (`Http::fake()` for the embedding service)
- [ ] AI search: `GET /listings?q=...` finds the closest category from the user's query
- [ ] Account deletion (GDPR right to erasure)
- [ ] React frontend
  - [x] Project setup (Vite, React Router), visual identity, log in and sign up pages
  - [x] Log in connected to the API (token stored client-side, sent as `Bearer`)
  - [x] "Offer your help" form: live preview, validation, city autocomplete (Photon)
  - [ ] Sign up connected to the API
  - [ ] Back-end support for the form's new fields (date, city, private address and phone)
  - [ ] Listings page with the AI search bar
  - [ ] Activity details and "Participate" button
  - [ ] "My activities" page with participation status (pending / approved)
- [ ] i18n (PT / EN / FR)

**Later (out of scope for the POC)**
- [ ] Trust and safety: user ratings and identity verification
- [ ] Database unique constraint on participations (`listing_id`, `user_id`) against race conditions

---

## About

This is a learning project and a proof of concept, built step by step to practice Laravel, React, REST APIs, authentication, and integrating an AI microservice.

**Author:** Nogueira Wallace · [GitHub](https://github.com/wall966)
