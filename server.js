
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const PRINTFUL_TOKEN = (process.env.PRINTFUL_TOKEN || '').trim().replace(/["']/g, '');
const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_WEBHOOK_SECRET = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// --- HYBRID PRINTFUL HANDLER ---
async function fetchFromPrintful(endpoint, method = 'GET', body = null, reqToken = null) {
  const token = reqToken || PRINTFUL_TOKEN;
  
  if (!token) {
    throw new Error('PRINTFUL_TOKEN_MISSING');
  }
  
  const url = `https://api.printful.com${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  
  if (endpoint.includes('/v2/')) {
    options.headers['X-PF-Version'] = '2.0.0';
  }

  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    const errorText = contentType?.includes('application/json') 
      ? (await response.json()).error?.message 
      : await response.text();
    
    if (response.status === 401) throw new Error('PRINTFUL_AUTH_FAILED');
    throw new Error(errorText || `Printful Error: ${response.status}`);
  }

  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

// --- API ENDPOINTS ---

app.get('/api/health', async (req, res) => {
  const reqToken = req.headers['x-printful-token'];
  const effectiveToken = reqToken || PRINTFUL_TOKEN;
  
  let printfulStatus = 'unknown';
  let storeDetails = null;
  try {
    if (effectiveToken) {
      // Handshake check
      const storesResponse = await fetchFromPrintful('/store', 'GET', null, effectiveToken);
      storeDetails = storesResponse.result || null;
      printfulStatus = 'connected_v1';
    } else {
      printfulStatus = 'missing_token';
    }
  } catch (err) {
    try {
        const v2Response = await fetchFromPrintful('/v2/stores', 'GET', null, effectiveToken);
        storeDetails = v2Response.data?.[0] || null;
        printfulStatus = 'connected_v2';
    } catch (v2Err) {
        printfulStatus = err.message === 'PRINTFUL_AUTH_FAILED' ? 'invalid_token' : 'error';
    }
  }

  return res.json({ 
    status: 'online', 
    bridge: {
      printful: printfulStatus,
      store: storeDetails,
      stripe: !!stripe
    }
  });
});

app.get('/api/printful/products', async (req, res) => {
  const reqToken = req.headers['x-printful-token'];
  try {
    let data;
    try {
        data = await fetchFromPrintful('/sync/products', 'GET', null, reqToken);
    } catch (v1Err) {
        data = await fetchFromPrintful('/v2/sync-products', 'GET', null, reqToken);
    }
    return res.json(data);
  } catch (err) {
    return res.status(err.message === 'PRINTFUL_AUTH_FAILED' ? 401 : 500).json({ error: err.message });
  }
});

app.get('/api/printful/products/:id', async (req, res) => {
  const reqToken = req.headers['x-printful-token'];
  try {
    let data;
    try {
        data = await fetchFromPrintful(`/sync/products/${req.params.id}`, 'GET', null, reqToken);
    } catch (v1Err) {
        data = await fetchFromPrintful(`/v2/sync-products/${req.params.id}`, 'GET', null, reqToken);
    }
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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
           return { variantId: variant ? variant.id : i.id, quantity: i.quantity };
        }))
      }
    });
    return res.json({ url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Explicit 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API_ENDPOINT_NOT_FOUND' });
});

const distPath = path.resolve(__dirname, 'dist');
app.use(cors());
app.use(express.json());
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Build folder missing. Run "npm run build" first.');
  }
});

app.listen(PORT, () => {
  console.log(`[STITCH_BRIDGE] Server ready on port ${PORT}`);
});
