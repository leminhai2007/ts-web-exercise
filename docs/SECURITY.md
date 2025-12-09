# Security Guide

This guide covers security best practices for your application, including code obfuscation, environment variables, and sensitive data protection.

## 1. Code Minification & Obfuscation

### Vite Default Behavior

✅ **Good News**: Vite automatically minifies and uglifies your production code!

When you run `yarn build`, Vite:

- Minifies JavaScript using esbuild (very fast)
- Removes whitespace and comments
- Shortens variable names
- Removes dead code
- Optimizes bundle size

### Enhanced Configuration

The project is configured in `vite.config.ts` with:

```typescript
build: {
    minify: 'esbuild', // Fast minification
    terserOptions: {
        compress: {
            drop_console: true,    // Remove console.log in production
            drop_debugger: true,   // Remove debugger statements
        },
    },
    sourcemap: false, // Don't generate source maps (harder to reverse engineer)
}
```

### Verify Minification

```bash
# Build for production
yarn build

# Check the output in dist/assets/
# You'll see minified files like: index-abc123.js
```

The output will be uglified and difficult to read.

---

## 2. Environment Variables

### Setup

#### Create Environment Files

```bash
# Development (not committed)
.env.local

# Production (set on hosting platform)
.env.production
```

#### Example `.env.local`

```env
# API Keys
VITE_API_KEY=sk_test_abc123xyz789
VITE_API_URL=https://api.example.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true

# Other Config
VITE_APP_VERSION=1.0.0
```

⚠️ **Important**: All variables must start with `VITE_` to be exposed to the client!

### Usage in Code

```typescript
// src/config/env.ts
export const config = {
    apiKey: import.meta.env.VITE_API_KEY,
    apiUrl: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
};

// In components
import { config } from '../config/env';

fetch(`${config.apiUrl}/data`, {
    headers: {
        Authorization: `Bearer ${config.apiKey}`,
    },
});
```

### Type Safety for Environment Variables

Create `src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_KEY: string;
    readonly VITE_API_URL: string;
    readonly VITE_ENABLE_ANALYTICS: string;
    // Add more as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
```

### Setting Environment Variables on Hosting Platforms

#### Vercel

1. Go to Project Settings → Environment Variables
2. Add each variable (without `VITE_` prefix shown in UI)
3. Set for Production/Preview/Development
4. Redeploy

#### Netlify

1. Site Settings → Environment Variables
2. Add each variable
3. Redeploy

#### GitHub Actions

```yaml
env:
    VITE_API_KEY: ${{ secrets.VITE_API_KEY }}
```

---

## 3. Sensitive Data Protection

### ⚠️ Critical Rules

#### NEVER Put These in Frontend Code:

- ❌ Database passwords
- ❌ Private API keys (server-side keys)
- ❌ Secret tokens
- ❌ Encryption keys
- ❌ Authentication secrets

#### ✅ Safe for Frontend:

- ✅ Public API keys (explicitly marked as public)
- ✅ API endpoints (public URLs)
- ✅ Feature flags
- ✅ Configuration values
- ✅ Public identifiers

### Client vs Server Secrets

```typescript
// ❌ WRONG - Never in frontend code
const SECRET_KEY = 'my_secret_key_12345';
const DATABASE_PASSWORD = 'db_pass_xyz';

// ✅ CORRECT - Public API key (if needed in frontend)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
```

### Encryption for Sensitive Frontend Data

If you must store sensitive data temporarily (e.g., user tokens):

```bash
yarn add crypto-js
```

```typescript
// src/utils/encryption.ts
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-key';

export const encrypt = (data: string): string => {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decrypt = (encrypted: string): string => {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

// Usage
const token = 'user_auth_token';
const encrypted = encrypt(token);
localStorage.setItem('auth', encrypted);

// Later
const encrypted = localStorage.getItem('auth');
const decrypted = decrypt(encrypted);
```

⚠️ **Note**: This provides basic obfuscation but is NOT truly secure (frontend encryption keys can be extracted). Real security requires server-side handling.

---

## 4. Secure Storage Best Practices

### Local Storage vs Session Storage vs Cookies

| Storage            | Security | Persistence  | XSS Vulnerable | Best For                  |
| ------------------ | -------- | ------------ | -------------- | ------------------------- |
| localStorage       | Low      | Permanent    | Yes            | Non-sensitive settings    |
| sessionStorage     | Low      | Session only | Yes            | Temporary data            |
| Cookies (HttpOnly) | High     | Configurable | No             | Auth tokens (server-side) |

### Example: Secure Token Storage

```typescript
// ❌ WRONG
localStorage.setItem('authToken', token);

// ✅ BETTER (if must use frontend storage)
// Store encrypted and with expiration
const storeToken = (token: string) => {
    const data = {
        token: encrypt(token),
        expires: Date.now() + 3600000, // 1 hour
    };
    sessionStorage.setItem('auth', JSON.stringify(data));
};

const getToken = (): string | null => {
    const stored = sessionStorage.getItem('auth');
    if (!stored) return null;

    const data = JSON.parse(stored);
    if (Date.now() > data.expires) {
        sessionStorage.removeItem('auth');
        return null;
    }

    return decrypt(data.token);
};

// ✅ BEST (use HttpOnly cookies set by backend)
// This requires backend API to set cookies
fetch('/api/login', {
    credentials: 'include', // Include cookies
});
```

---

## 5. API Security

### Protect API Keys

```typescript
// src/config/api.ts
export const API_CONFIG = {
    // Public keys only!
    publicKey: import.meta.env.VITE_PUBLIC_API_KEY,
    endpoint: import.meta.env.VITE_API_URL,
};

// Use proxy for sensitive operations
export const fetchSecure = async (path: string) => {
    // Call your backend, which has the real secrets
    return fetch(`/api/proxy${path}`, {
        credentials: 'include',
    });
};
```

### Rate Limiting (Backend Responsibility)

Frontend can't truly rate limit, but you can:

```typescript
// Simple debounce to reduce calls
import { debounce } from 'lodash-es';

const debouncedSearch = debounce((query: string) => {
    fetchData(query);
}, 300);
```

---

## 6. Content Security Policy (CSP)

Add to `index.html`:

```html
<meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;"
/>
```

Or configure on your hosting platform:

**Vercel** (`vercel.json`):

```json
{
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "Content-Security-Policy",
                    "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
                }
            ]
        }
    ]
}
```

---

## 7. Dependency Security

### Regular Audits

```bash
# Check for vulnerabilities
yarn audit

# Fix automatically (if possible)
yarn audit fix
```

### Keep Dependencies Updated

```bash
# Check outdated packages
yarn outdated

# Update packages
yarn upgrade-interactive --latest
```

### Use Dependabot (GitHub)

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
    - package-ecosystem: 'npm'
      directory: '/'
      schedule:
          interval: 'weekly'
```

---

## 8. Build Security Checklist

Before deploying to production:

- [ ] Run `yarn build` and check output is minified
- [ ] Verify no console.logs in production code
- [ ] Check `.env.local` is in `.gitignore`
- [ ] Environment variables set on hosting platform
- [ ] No hardcoded secrets in code
- [ ] Source maps disabled (`sourcemap: false`)
- [ ] Dependencies audited (`yarn audit`)
- [ ] HTTPS enabled (automatic on most platforms)
- [ ] CSP headers configured
- [ ] API keys are public-safe or proxied through backend

---

## 9. Additional Security Measures

### Input Validation

```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

### XSS Prevention

```typescript
// React already escapes by default, but for innerHTML:
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### HTTPS Only

Ensure your hosting platform serves over HTTPS (Vercel/Netlify do this automatically).

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
```

---

## 10. Security Testing

### Before Deployment

```bash
# Build production version
yarn build

# Test locally
yarn preview

# Audit dependencies
yarn audit

# Check bundle size (smaller is better for security too)
yarn build --mode production
```

### After Deployment

- Test in incognito/private browsing
- Check browser console for errors
- Verify no secrets in network tab
- Test with browser dev tools open
- Use security scanners (Mozilla Observatory, Security Headers)

---

## Summary

✅ **Automatic Protection** (Vite handles):

- Code minification
- Variable name obfuscation
- Dead code elimination
- Bundle optimization

✅ **Manual Configuration** (You should do):

- Environment variables for secrets
- Disable source maps in production
- Use .gitignore for sensitive files
- Regular dependency audits
- Backend proxy for sensitive API calls

✅ **Best Practices**:

- Never store real secrets in frontend
- Use HttpOnly cookies for auth (backend)
- Validate and sanitize all user input
- Keep dependencies updated
- Enable CSP headers
- Use HTTPS always

⚠️ **Remember**: The frontend is never truly secure. Treat it as public. All real security must happen on the backend/server!
