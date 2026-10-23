<p align="center">
  <img src="docs/banner.png" alt="Studios Stitch" width="100%">
</p>

# Studios Stitch

**Streetwear shop front end with Printful, Stripe, Firebase, and Supabase service hooks.**

[![License: All Rights Reserved](https://img.shields.io/badge/license-all%20rights%20reserved-lightgrey)](#license)
![Vite](https://img.shields.io/badge/Vite-646CFF&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB&logo=react&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF&logo=stripe&logoColor=white)

Vite/React storefront (shop, collections, product detail, gallery, studio lab, admin, profile). Logo referenced from Cloudinary in the app. A committed `.env` was found in this public repo — rotate those credentials; values are not documented here.

## Features

- Shop / collections / product detail / cart drawer
- Admin and profile pages
- Service modules for Printful, Stripe, Firebase, Supabase, Gemini
- Express `server.js` for Stripe webhook path

## Tech stack

- Vite + React + TypeScript
- Stripe / Printful / Firebase / Supabase clients
- Express

## How to run

```bash
npm install
npm run dev
npm run build
npm start   # node server.js
```

Use env var **names** only (`API_KEY`, `PRINTFUL_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`). Do not commit values.

## Environment variables

Names only. Never commit values.

- `API_KEY`
- `PRINTFUL_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`

## Status

Public. Early shop scaffold. **Security: rotate secrets that were committed in `.env`.**

## License

All rights reserved.
