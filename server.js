
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const PRINTFUL_TOKEN = (process.env.PRINTFUL_TOKEN || '').trim().replace(/["']/g, '');
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// --- WEBHOOK ENDPOINT (MUST BE BEFORE express.json()) ---
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error('[STRIPE] Webhook received but Stripe is not configured.');
    return res.status(400).send('Stripe configuration missing');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[STRIPE] Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await handleSuccessfulPayment(session);
    } catch (orderErr) {
      console.error(`[PRINTFUL] Order creation failed after payment: ${orderErr.message}`);
    }
  }

  res.json({ received: true });
});

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Add Cache-Control to prevent Hostinger/LiteSpeed from caching API 404s
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// --- PRINTFUL LOGIC ---
async function fetchFromPrintful(endpoint, method = 'GET', body = null) {
  if (!PRINTFUL_TOKEN) throw new Error('PRINTFUL_TOKEN missing on server environment.');
  
  const url = `https://api.printful.com${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  console.log(`[PRINTFUL_PROXY] Requesting: ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    console.error(`[PRINTFUL_PROXY] Error ${response.status}:`, data);
    throw new Error(data?.error?.message || `Printful: ${response.status}`);
  }
  return data;
}

async function handleSuccessfulPayment(session) {
  const variantsMetadata = JSON.parse(session.metadata.variants || '[]');
  const printfulOrder = {
    recipient: {
      name: session.shipping_details?.name || 'Customer',
      address1: session.shipping_details?.address?.line1,
      city: session.shipping_details?.address?.city,
      state_code: session.shipping_details?.address?.state,
      country_code: session.shipping_details?.address?.country,
      zip: session.shipping_details?.address?.postal_code,
      email: session.customer_details?.email
    },
    items: variantsMetadata.map(v => ({
      sync_variant_id: v.variantId,
      quantity: v.quantity
    }))
  };
  return await fetchFromPrintful('/orders', 'POST', printfulOrder);
}

// --- API ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    timestamp: new Date().toISOString(),
    config_check: {
      printful_loaded: !!PRINTFUL_TOKEN,
      printful_prefix: PRINTFUL_TOKEN.substring(0, 4) + '...',
      stripe_loaded: !!stripe
    }
  });
});

app.get('/api/printful/products', async (req, res) => {
  try {
    console.log('[API] Fetching products from Printful...');
    const data = await fetchFromPrintful('/store/products');
    console.log(`[API] Found ${data.result?.length || 0} products.`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/printful/products/:id', async (req, res) => {
  try {
    const data = await fetchFromPrintful(`/store/products/${req.params.id}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/checkout/create-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe configuration missing' });
  try {
    const { items, customerEmail } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(i => ({
        price_data: {
          currency: 'usd',
          product_data: { name: i.name, images: [i.thumbnail_url] },
          unit_amount: Math.round(i.price * 100),
        },
        quantity: i.quantity,
      })),
      mode: 'payment',
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'] },
      success_url: `${req.headers.origin}/#/checkout-success`,
      cancel_url: `${req.headers.origin}/#/shop`,
      metadata: {
        variants: JSON.stringify(items.map(i => {
           const variant = i.variants.find(v => v.size === i.selectedSize);
           return {
             variantId: variant ? variant.id : i.id,
             quantity: i.quantity
           };
        }))
      }
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Explicitly handle 404s for API to avoid serving index.html for missing routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `STITCH_TERMINAL: Endpoint ${req.method} ${req.url} not found on this server.` });
});

// --- STATIC ASSETS ---
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[STITCH] Terminal running on port ${PORT}`);
});
