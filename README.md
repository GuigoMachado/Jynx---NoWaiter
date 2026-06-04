# Projeto Jynx

This project includes a static frontend and a Node.js backend API for loading menu items from Neon and saving orders.

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` with your Neon connection string
3. Install dependencies:

```bash
npm install
```

4. Start the server:

```bash
npm start
```

Or start the development watcher, which restarts the server automatically when files change:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Public deployment

This project can be deployed to a public hosting platform so everyone can use it during your presentation.

Recommended platforms:
- Render
- Railway
- Fly.io
- Vercel (with a Node server or serverless API)

Required configuration:
- `DATABASE_URL` should point to your hosted PostgreSQL database
- `PORT` can be set by the host if needed

If you deploy to a public URL like `https://meuapp.com`, you can generate QR codes for each table using:

- `https://meuapp.com/?table=1`
- `https://meuapp.com/?table=2`

Each QR code opens the app already configured for that table.

## Admin dashboard

An admin dashboard is available at `admin.html`:

- `http://localhost:3000/admin.html`

## Generating QR code images (optional)

If you want JPG files for each table stored in the project, run the included script which downloads QR images into a `qr/` folder.

1. Install `requests` (Python 3):

```bash
pip install requests
```

2. Run the generator (make sure your app is reachable at the `BASE_URL` in the script or edit it):

```bash
python generate_qr_images.py
```

This will create `qr/table-1.jpg` ... `qr/table-10.jpg`.

This dashboard shows all orders from the database and generates QR codes for tables.

## Neon database setup

1. Open Neon and connect to your project.
2. Create the `menu_items` and `orders` tables.
3. Use `db.sql` as the schema and sample data loader.

If your Neon console rejects `uuid_generate_v4()`, use `gen_random_uuid()` and enable `pgcrypto`.

## API endpoints

- `GET /api/category-items?category=Entradas`
- `POST /api/orders`

## Database tables

- `menu_items` should contain: `id`, `category`, `name`, `description`, `price`, `image_url`, `available`
- `orders` should contain: `id`, `item_id`, `quantity`, `notes`, `price_each`, `total_price`
