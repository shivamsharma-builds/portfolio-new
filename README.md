# Shivam Sharma Portfolio — Admin + Aiven PostgreSQL + Resend

This version keeps the existing React/Vite portfolio design and moves the site's editable content into **Aiven PostgreSQL**. It adds a protected `/admin` portal, full content CRUD/reordering, contact-message management, subscriber management, and **Resend** transactional emails.

## What changed

- Added `/admin` login authentication with an HttpOnly signed session cookie.
- Added a PostgreSQL data layer using `pg`, designed for Aiven PostgreSQL.
- Seeded the current portfolio content into PostgreSQL on first run:
  - profile / hero / about / contact / footer settings
  - social links
  - navigation links
  - about stats
  - skills and additional skills
  - education
  - experience
  - projects
  - certificates
- Added admin controls to add, edit, delete and reorder every content collection.
- Added admin views for contact messages and subscribers.
- Removed Nodemailer/SMTP and replaced it with Resend.
- Contact submissions now send a confirmation to the visitor and a notification to the owner.
- Newsletter subscriptions send a confirmation to the subscriber and a notification to the owner.
- Added a public subscription form in the Contact section.
- The public portfolio reads its editable content from `/api/site`, with the bundled content as a safe fallback.

## Architecture

```text
Browser
  ├── /                     React portfolio
  └── /admin                React admin portal
          │
          ▼
      Vercel / Express API
          │
          ├── Aiven PostgreSQL
          │     ├── site_settings
          │     ├── content_items
          │     ├── contact_messages
          │     ├── subscribers
          │     └── admin_users
          │
          └── Resend
                ├── visitor/subscriber confirmations
                └── owner notifications
```

Aiven recommends TLS for PostgreSQL connections; this project accepts an Aiven connection URI with `sslmode=require` and also supports an Aiven CA file for stronger certificate verification. See the official Aiven connection guidance. 

Resend's official Node.js integration uses the `Resend` SDK and `resend.emails.send(...)`; this project uses that SDK rather than SMTP/Nodemailer.

## Environment variables

Copy `.env.example` to `.env` for local development.

### Aiven PostgreSQL

```env
DATABASE_URL=postgres://avnadmin:YOUR_PASSWORD@YOUR_AIVEN_HOST:PORT/defaultdb?sslmode=require
AIVEN_POSTGRES_CA_PATH=
PG_POOL_MAX=5
```

You can get the PostgreSQL service URI from the Aiven Console's connection information. For stronger certificate verification, download the Aiven CA certificate and set `AIVEN_POSTGRES_CA_PATH`.

### Resend

```env
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM="Shivam Sharma <your-verified-domain@example.com>"
```

For production, use a sender address on a domain you have configured in Resend. The example `onboarding@resend.dev` is useful for initial testing where supported by your Resend account.

### Admin authentication

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=scrypt$...
ADMIN_SESSION_SECRET=use-a-long-random-secret
```

Generate a password hash with:

```bash
npm run admin:hash -- "your-strong-password"
```

Copy the printed `scrypt$...` value into `ADMIN_PASSWORD_HASH`.

The first time the API starts, it creates the `admin_users` table and inserts `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` if that admin does not already exist.

## Database initialization / current content migration

The API automatically creates the required tables and seeds the current site content when the database is empty.

You can also run the explicit seed command:

```bash
npm run db:seed
```

The seed is intentionally non-destructive: if a content section already contains rows, it does not overwrite those rows.

## Local development

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Start the API separately:

```bash
npm run server
```

Or run both:

```bash
npm run dev:full
```

The portfolio is normally available at `http://localhost:5173` and the local API at `http://localhost:5000`.

Open the admin portal at:

```text
http://localhost:5173/admin
```

If the Vite development server is being used, the frontend and API should be proxied or deployed together for same-origin `/api/*` calls. The existing Vercel architecture uses same-origin serverless functions.

## Vercel deployment

Use one Vercel project:

```text
Framework: Vite
Root: ./
Build command: npm run build
Output directory: dist
Install command: npm install
```

Add these production environment variables in Vercel:

```text
DATABASE_URL
AIVEN_POSTGRES_CA_PATH (optional)
PG_POOL_MAX
PORTFOLIO_NAME
CONTACT_EMAIL
CONTACT_PHONE
CONTACT_LOCATION
CONTACT_AVAILABILITY
RESEND_API_KEY
RESEND_FROM
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
```

No `VITE_*` secret is needed.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/site` | Public editable portfolio data |
| POST | `/api/contact` | Save contact message + send visitor/owner emails |
| POST | `/api/subscribe` | Save subscriber + send subscriber/owner emails |
| GET | `/api/health` | Aiven PostgreSQL health check |
| POST | `/api/admin/login` | Admin authentication |
| POST | `/api/admin/logout` | End admin session |
| GET | `/api/admin/me` | Check admin session |
| GET/PUT/POST/PATCH/DELETE | `/api/admin/content` | Manage settings and content items |
| GET/DELETE | `/api/admin/messages` | Manage contact messages |
| GET/DELETE | `/api/admin/subscribers` | Manage subscribers |

## Admin portal features

The `/admin` portal includes:

- Secure login before access to management screens.
- Site Settings editor.
- Social Links CRUD + ordering.
- Navigation CRUD + ordering.
- About Stats CRUD + ordering.
- Skills CRUD + ordering.
- Additional Skills CRUD + ordering.
- Education CRUD + ordering.
- Experience CRUD + ordering.
- Projects CRUD + ordering.
- Certificates CRUD + ordering.
- Contact message inbox with deletion.
- Subscriber list with deletion.
- Manual refresh and logout.

Content collection records are stored as JSONB, so adding a new field later does not require a database migration for every small content change.

## Email behavior

### Contact form

A contact form submission is saved in `contact_messages`. Resend then sends:

1. A confirmation email to the visitor.
2. A notification email to the portfolio owner.

The database record is retained even if Resend is temporarily unavailable.

### Subscriber form

A new subscriber is saved in `subscribers`. Resend then sends:

1. A subscription confirmation to the new subscriber.
2. A new-subscriber notification to the owner.

Duplicate email addresses are ignored with an `alreadySubscribed` response.

## Security notes

- Never commit `.env` or production secrets.
- Use a long random `ADMIN_SESSION_SECRET`.
- Use a strong admin password and store only its scrypt hash.
- Keep Aiven and Resend credentials server-side.
- Use HTTPS in production.
- For Aiven, prefer CA verification when the deployment environment makes the CA certificate available.
- Keep Resend's sender domain verified before production email delivery.

## Important limitation

I can modify and package the project, but I cannot connect to your private Aiven or Resend accounts without their credentials/connection details. The archive is therefore prepared to connect to them through environment variables. After you add the Aiven `DATABASE_URL`, Resend API key/from address, and admin credentials, running `npm run db:seed` will create the schema and migrate the current portfolio content.

## Image uploads

The admin portal now has a **Choose image** upload control for profile images, projects, and certificates. Images are validated in the browser (image formats only, maximum 2 MB), previewed before saving, and stored as data URLs inside PostgreSQL JSONB so the public site can load them directly from the database without requiring a separate storage service. For a large production media library, object storage such as S3/Cloudinary is recommended instead.

## Email delivery status

Contact and subscription email delivery is attempted independently for both recipients. A failure sending the owner notification no longer prevents the visitor/subscriber confirmation from being sent, and vice versa. The API response reports which recipient(s) were successfully notified.
