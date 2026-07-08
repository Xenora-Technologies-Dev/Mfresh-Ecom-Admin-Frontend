# MFresh Portal v1.0.0

Secure B2B portal for **buyers**, **sellers**, and **marketplace operations**.

## Features

- **Role-based workspaces**
  - **Buyer** — procurement dashboard, catalog access
  - **Seller** — product management workspace
  - **Operations** — full marketplace administration
- **Sign-in portal** at `/login` with role selection
- **USD base currency** with configurable AED/SGD exchange rates
- **Demo authentication** — session persisted locally; backend auth planned for next release

## Run locally

```bash
cd Frontend/Admin
npm install
npm run dev
```

Portal: http://localhost:3007/login
Storefront: http://localhost:3006

## Environment

See `.env.example` for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STOREFRONT_URL`.
