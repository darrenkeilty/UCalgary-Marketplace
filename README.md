# UCalgary Marketplace

A full-stack web marketplace exclusively for the University of Calgary community. Students and staff can buy and sell items, post and discover campus events, and connect with each other — all behind a `@ucalgary.ca` email gate.

---

## Features

### For Users
- **Marketplace** — List items for sale with photos, condition, price, and location. Browse and filter listings by category, price, and condition.
- **Events** — Post and discover campus events with organization name, date/time range, and description.
- **Contact Seller** — Reach out to listing owners directly via email, no account sharing required.
- **Save Posts** — Bookmark listings and events to revisit later from your profile.
- **My Dashboard** — View and manage your active posts, events, saved items, and sellers you've contacted.
- **Report Content** — Flag posts or users for review by an admin.
- **Account Settings** — Update your profile information and password.
- **Password Reset** — Recover account access via email link.

### For Admins
- **Admin Dashboard** — Overview of recent moderation actions.
- **User Management** — Search for users and ban accounts.
- **Reported Content** — Review reported marketplace posts, events, and users, then take action.
- **Audit Log** — Track recent admin activity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material UI, React Router, React Hook Form |
| Backend | Node.js, Express 5 |
| Database | MySQL 8 |
| Email | Nodemailer |
| Auth | bcryptjs (password hashing) |
| Infrastructure | Docker, Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js & npm](https://nodejs.org/) (only needed for local development outside Docker)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/darrenkeilty/UCalgary-Marketplace.git
cd UCalgary-Marketplace
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
cp .env.sample .env
```

Open `.env` and fill in your own values.

```env
DB_PASSWORD=your_password_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
```

- **`DB_PASSWORD`** — any value you like; it is only used by your local MySQL container.
- **`EMAIL_USER` / `EMAIL_PASS`** — required for the email features (registration verification, password reset, contact seller). Supply a Gmail address and a **Google App Password**, not your normal account password.

To generate an App Password: enable 2-Step Verification on the Google account, then go to **Google Account → Security → 2-Step Verification → App passwords** and create one for this project. Google shows it once, as 16 characters. Paste it into `.env` as `EMAIL_PASS` and store it in a password manager.

The app runs fine without email configured — registration verification, password reset, and contact-seller will simply fail until you add credentials.

### 3. Start all services

```bash
docker compose up -d
```

This starts three containers: `frontend`, `backend`, and `db`. The database takes ~30 seconds to initialize. You'll know it's ready when the output looks like this:

```
[+] Running 4/4
 ✔ Network ucalgary-marketplace_default   Created
 ✔ Container db                           Healthy
 ✔ Container ucalgary-marketplace-backend-1   Started
 ✔ Container ucalgary-marketplace-frontend-1  Started
```

### 4. Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |

To verify the backend is running:
```bash
curl localhost:8080
# → {"message":"Backend is running"}
```

To access the MySQL database directly:
```bash
docker exec -it db mysql -u root -p
# Enter the DB_PASSWORD from your .env when prompted
```

---

## Seeded Demo Data

The database is pre-populated with sample users, listings, and events so you can explore the app immediately. These accounts exist only in your local container and are seeded from `db/init.sql`.

### Regular Users
| Email | Password |
|---|---|
| mike.wazowski@ucalgary.ca | A!123456 |
| chicken.little@ucalgary.ca | A!123456 |
| buzz.lightyear@ucalgary.ca | A!123456 |
| mary.poppins@ucalgary.ca | A!123456 |

### Admin Users
| Email | Password |
|---|---|
| daffy.duck@ucalgary.ca | A!123456 |
| pink.panther@ucalgary.ca | A!123456 |

> You can also register your own account if you have access to a `@ucalgary.ca` email address.

---

## Project Structure

```
UCalgary-Marketplace/
├── frontend/               # React + Vite app
│   └── src/
│       ├── pages/          # Route-level page components
│       ├── components/     # Shared UI components
│       └── assets/         # Images, SVGs
├── backend/                # Express API
│   └── src/
│       ├── routes/         # Route definitions
│       ├── controller/     # Business logic (auth, posts, admin, etc.)
│       └── config/         # DB and mail configuration
├── db/
│   └── init.sql            # Database schema + seed data
├── compose.yaml            # Docker Compose config
└── .env.sample             # Environment variable template
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Authenticate a user |
| POST | `/api/registration` | Register a new user |
| POST/GET | `/api/password` | Reset / update password |
| GET/POST | `/api/posts` | Browse or create listings/events |
| POST | `/api/contactSeller` | Email a seller |
| GET/POST | `/api/getSavedPosts` | View or save bookmarks |
| GET | `/api/my-posts` | Current user's listings |
| GET | `/api/my-events` | Current user's events |
| GET | `/api/contacted` | Posts the user has contacted |
| POST | `/api/report` | Report a user or post |
| GET | `/api/admin/users` | Search users (admin) |
| DELETE | `/api/admin/users/ban` | Ban a user (admin) |
| DELETE | `/api/admin/posts/:postId` | Remove a post (admin) |
| GET | `/api/admin/reported-users` | View reported users (admin) |
| GET | `/api/admin/reported-market-posts` | View reported listings (admin) |
| GET | `/api/admin/reported-events` | View reported events (admin) |
| GET | `/api/admin/recent-actions` | Audit log (admin) |

---

## Stopping the App

```bash
docker compose down
```

To also remove the persistent database volume:

```bash
docker compose down -v
```
