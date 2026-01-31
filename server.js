
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
// This uses express.raw to ensure we have the untouched buffer for Stripe signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    console.error('[STRIPE] Webhook received but Stripe is not configured.');
    return res.status(400).send('Stripe configuration missing');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // req.body here is the raw buffer thanks to express.raw
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[STRIPE] Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the specific event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log(`[STRIPE] Payment successful for session: ${session.id}`);
    
    // Trigger Printful Order Creation
    try {
      await handleSuccessfulPayment(session);
    } catch (orderErr) {
      console.error(`[PRINTFUL] Order creation failed after payment: ${orderErr.message}`);
      // Note: We still return 200 to Stripe to acknowledge receipt of the webhook
    }
  }

  // Acknowledge receipt of the event
  res.json({ received: true });
});

// --- GLOBAL MIDDLEWARE (AFTER WEBHOOK) ---
app.use(cors());
app.use(express.json());

// Log all incoming requests to help diagnose routing issues on Hostinger
app.use((req, res, next) => {
  console.log(`[TERMINAL] ${new Date().toISOString()} | ${req.method} ${req.url}`);
  next();
});

// --- PRINTFUL LOGIC ---
async function fetchFromPrintful(endpoint, method = 'GET', body = null) {
  if (!PRINTFUL_TOKEN) throw new Error('PRINTFUL_TOKEN missing on server.');
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

  const response = await fetch(url, options);
  const rawText = await response.text();
  
  try {
    const data = JSON.parse(rawText);
    if (!response.ok) throw new Error(data?.error?.message || `Printful: ${response.status}`);
    return data;
  } catch (e) {
    throw new Error(`Printful Parse Error: ${rawText.substring(0, 50)}`);
  }
}

async function handleSuccessfulPayment(session) {
  // Extract variant and metadata for Printful
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

  console.log(`[PRINTFUL] Creating order for variant(s): ${variantsMetadata.map(v => v.variantId).join(', ')}`);
  return await fetchFromPrintful('/orders', 'POST', printfulOrder);
}

// --- API ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'active', 
    timestamp: new Date().toISOString(),
    config: { printful: !!PRINTFUL_TOKEN, stripe: !!stripe, webhook: !!STRIPE_WEBHOOK_SECRET } 
  });
});

app.get('/api/printful/products', async (req, res) => {
  try {
    const data = await fetchFromPrintful('/store/products');
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
    console.error(`[STRIPE] Session creation error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Catch-all for undefined /api routes (prevents text 404s)
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `STITCH_TERMINAL: Route ${req.method} ${req.url} not found.` });
});

// --- STATIC ASSETS ---
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n[STUDIOS STITCH TERMINAL]`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Web: https://studiosstitch.com`);
  console.log(`Stripe Webhook Target: https://studiosstitch.com/api/stripe/webhook`);
  console.log(`Status: ONLINE\n`);
});
