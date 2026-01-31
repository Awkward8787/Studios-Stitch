
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Use your Printful token from environment variables
const PRINTFUL_TOKEN = process.env.PRINTFUL_TOKEN;

app.use(cors());
app.use(express.json());

// API Middleware to check for token
const verifyToken = (req, res, next) => {
  if (!PRINTFUL_TOKEN) {
    console.error("SERVER_ERROR: PRINTFUL_TOKEN is missing from environment.");
    return res.status(500).json({ error: "Backend configuration error: PRINTFUL_TOKEN missing." });
  }
  next();
};

// Printful Proxy Endpoint: Get All Products
app.get('/api/printful/products', verifyToken, async (req, res) => {
  try {
    const response = await fetch('https://api.printful.com/store/products', {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Printful API Error");
    
    res.json(data);
  } catch (error) {
    console.error("Fetch Products Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Printful Proxy Endpoint: Get Single Product Detail
app.get('/api/printful/products/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fetch(`https://api.printful.com/store/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Printful API Detail Error");
    
    res.json(data);
  } catch (error) {
    console.error(`Fetch Product ${req.params.id} Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle SPA routing: send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`STITCH_SERVER_LIVE: http://localhost:${PORT}`);
  if (!PRINTFUL_TOKEN) {
    console.warn("WARNING: PRINTFUL_TOKEN is not set. Inventory will fail.");
  }
});
