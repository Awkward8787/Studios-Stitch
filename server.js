
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

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[INCOMING] ${req.method} ${req.url}`);
    }
    next();
});

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
