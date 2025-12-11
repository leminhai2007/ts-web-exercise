# Backend API Architecture

## Overview

This document describes the backend architecture for handling external API integrations that don't support CORS. The solution uses a proxy pattern that works seamlessly in both development and production environments.

## Architecture Pattern

### The Problem

Many third-party APIs (like You Do Sudoku) don't support CORS, which means browsers block direct requests from frontend applications due to Same-Origin Policy.

### The Solution

**Backend Proxy Pattern:**

- Frontend calls internal API endpoint
- Backend server/function proxies request to external API
- Backend adds CORS headers to response
- Frontend receives data without CORS errors

This approach:

- ✅ Bypasses CORS restrictions
- ✅ Hides API keys and secrets
- ✅ Enables request/response transformation
- ✅ Allows caching and rate limiting

## Current Implementation

### Development Environment

**Technology:** Express.js Server  
**File:** `server.js`  
**Port:** 3000

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Proxy endpoint
app.post('/api/youdosudoku', async (req, res) => {
    try {
        console.log('Proxying request to You Do Sudoku API...');
        console.log('Request body:', req.body);

        // Forward request to external API
        const response = await fetch('https://www.youdosudoku.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        console.log('External API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log('Successfully fetched data');

        // Return data with CORS headers already set by cors() middleware
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({
            error: 'Failed to fetch data from external API',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend proxy server running on http://localhost:${PORT}`);
});
```

**Start Development:**

```bash
yarn dev
```

This runs:

- Express server on port 3000
- Vite dev server on port 5173
- Vite proxies `/api/*` requests to Express server

### Production Environment

**Technology:** Vercel Serverless Functions  
**File:** `api/youdosudoku.ts`  
**Runtime:** Node.js

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Proxying request to You Do Sudoku API...');
        console.log('Request body:', req.body);

        // Forward the request to external API
        const response = await fetch('https://www.youdosudoku.com/api/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        console.log('External API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Successfully fetched data');

        // Return the data
        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch data from external API',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
```

## Adding New API Endpoints

### Step 1: Add Development Endpoint (Express)

Edit `server.js` and add a new route:

```javascript
// Example: New endpoint for a weather API
app.get('/api/weather/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const apiKey = process.env.WEATHER_API_KEY; // From .env file

        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);

        if (!response.ok) {
            throw new Error(`Weather API failed with status ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({
            error: 'Failed to fetch weather data',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
```

### Step 2: Add Production Endpoint (Vercel Function)

Create `api/weather.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { city } = req.query;

        if (!city || typeof city !== 'string') {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        const apiKey = process.env.WEATHER_API_KEY; // From Vercel environment variables

        const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);

        if (!response.ok) {
            throw new Error(`Weather API failed with status ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Weather API error:', error);
        return res.status(500).json({
            error: 'Failed to fetch weather data',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
```

### Step 3: Update Vercel Configuration

Edit `vercel.json` to add routing (optional, Vercel auto-routes `api/*.ts` files):

```json
{
    "rewrites": [
        {
            "source": "/api/youdosudoku",
            "destination": "/api/youdosudoku.ts"
        },
        {
            "source": "/api/weather",
            "destination": "/api/weather.ts"
        }
    ]
}
```

### Step 4: Create Frontend API Client

Create `src/api/weatherApi.ts`:

```typescript
export interface WeatherData {
    location: {
        name: string;
        country: string;
    };
    current: {
        temp_c: number;
        condition: {
            text: string;
        };
    };
}

export const getWeather = async (city: string): Promise<WeatherData> => {
    try {
        const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch weather: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Weather API error:', error);
        throw error;
    }
};
```

### Step 5: Use in Component

```typescript
import { getWeather } from '../api/weatherApi';

function WeatherComponent() {
    const [weather, setWeather] = useState<WeatherData | null>(null);

    const fetchWeather = async (city: string) => {
        try {
            const data = await getWeather(city);
            setWeather(data);
        } catch (error) {
            console.error('Failed to get weather:', error);
        }
    };

    // ... rest of component
}
```

## Environment Variables

### Development (.env)

Create `.env` file in project root:

```env
# External API Keys
WEATHER_API_KEY=your_weather_api_key_here
ANOTHER_API_KEY=another_key_here
```

**Important:** `.env` is already in `.gitignore` - never commit API keys!

### Production (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add variables:
    - Name: `WEATHER_API_KEY`
    - Value: `your_actual_api_key`
    - Environments: Production, Preview, Development

Vercel automatically injects these into serverless functions via `process.env`.

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
    const response = await fetch(externalApiUrl);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
} catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error',
    });
}
```

### 2. Request Validation

Validate input before forwarding:

```typescript
if (!req.body || !req.body.difficulty) {
    return res.status(400).json({
        error: 'Missing required parameter: difficulty',
    });
}

const allowedDifficulties = ['easy', 'medium', 'hard'];
if (!allowedDifficulties.includes(req.body.difficulty)) {
    return res.status(400).json({
        error: 'Invalid difficulty. Must be: easy, medium, or hard',
    });
}
```

### 3. CORS Configuration

For development (Express):

```javascript
import cors from 'cors';

// Allow all origins (development)
app.use(cors());

// Or restrict to specific origin
app.use(
    cors({
        origin: 'http://localhost:5173',
    })
);
```

For production (Vercel):

```typescript
// Allow all origins
res.setHeader('Access-Control-Allow-Origin', '*');

// Or restrict to your domain
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
```

### 4. Rate Limiting

Add rate limiting to prevent abuse:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Caching

Cache responses to reduce external API calls:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const cacheKey = JSON.stringify(req.query);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('Returning cached data');
        return res.status(200).json(cached.data);
    }

    // Fetch from external API
    const data = await fetchExternalAPI();

    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return res.status(200).json(data);
}
```

### 6. Logging

Add comprehensive logging for debugging:

```typescript
console.log('=== API Request ===');
console.log('Method:', req.method);
console.log('Body:', req.body);
console.log('Query:', req.query);
console.log('Headers:', req.headers);
console.log('==================');

// After response
console.log('External API Status:', response.status);
console.log('Response time:', Date.now() - startTime, 'ms');
```

## Testing

### Development Testing

```bash
# Start dev servers
yarn dev

# Test endpoint
curl -X POST http://localhost:3000/api/youdosudoku \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "easy", "solution": true, "array": false}'
```

### Production Testing

After deploying to Vercel:

```bash
# Test on deployed site
curl -X POST https://your-site.vercel.app/api/youdosudoku \
  -H "Content-Type: application/json" \
  -d '{"difficulty": "easy", "solution": true, "array": false}'
```

## Deployment Checklist

- [ ] Add new endpoint to `server.js` (development)
- [ ] Create new file in `api/` folder (production)
- [ ] Add route to `vercel.json` if needed
- [ ] Create frontend API client in `src/api/`
- [ ] Add environment variables to `.env`
- [ ] Add environment variables to Vercel dashboard
- [ ] Test endpoint locally with `yarn dev`
- [ ] Commit and push to trigger Vercel deployment
- [ ] Test endpoint on deployed site
- [ ] Update documentation

## Common Issues

### Issue: CORS errors in production

**Solution:** Ensure CORS headers are set before any response:

```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
    return res.status(200).end();
}
```

### Issue: 500 Internal Server Error

**Solution:** Check Vercel function logs:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → Functions tab
3. Check logs for error details

### Issue: Environment variables not working

**Solution:**

- Development: Check `.env` file exists and is not in `.gitignore`
- Production: Verify variables are set in Vercel dashboard
- Redeploy after adding new environment variables

### Issue: Proxy not working in development

**Solution:** Ensure both servers are running:

```bash
# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Restart dev servers
yarn dev
```

## File Structure

```
ts-web-exercise/
├── api/                        # Production serverless functions
│   ├── youdosudoku.ts         # Sudoku API proxy
│   └── weather.ts             # Weather API proxy (example)
│
├── src/                        # Frontend application
│   ├── api/                   # Frontend API clients
│   │   ├── sudokuApi.ts      # Sudoku client
│   │   └── weatherApi.ts     # Weather client (example)
│   └── components/
│
├── server.js                   # Development proxy server (Express)
├── vite.config.ts             # Vite configuration with proxy
├── vercel.json                # Vercel routing configuration
├── .env                       # Local environment variables (gitignored)
└── package.json               # Dependencies and scripts
```

## Dependencies

### Required Packages

```json
{
    "dependencies": {
        "express": "^5.2.1",
        "cors": "^2.8.5"
    },
    "devDependencies": {
        "@vercel/node": "^5.5.15",
        "concurrently": "^9.2.1"
    }
}
```

### Installation

```bash
yarn add express cors
yarn add -D @vercel/node concurrently
```

---

**Last Updated:** December 11, 2025  
**Architecture:** Monorepo with Express (dev) + Vercel Serverless (prod)  
**Framework:** React + TypeScript + Vite
