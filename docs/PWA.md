# Progressive Web App (PWA) Features

## Overview

This project is now a Progressive Web App (PWA), which means it can be installed on devices and work offline.

## Features Implemented

### 1. **Service Worker**

- Automatically caches all app resources for offline use
- Runtime caching for external resources (fonts, etc.)
- Auto-updates when new content is available

### 2. **Web App Manifest**

- Defines app name, icons, theme colors, and display mode
- Enables "Add to Home Screen" functionality on mobile devices
- Provides a native app-like experience

### 3. **Install Button**

- Located in the homepage header
- Only appears when the app is installable (on supported browsers)
- Allows users to install the app with one click

### 4. **Offline Indicator**

- Shows real-time online/offline status
- Green indicator when online
- Red indicator when offline
- Pulsing animation for visual feedback

## How to Install

### Desktop (Chrome, Edge, Opera)

1. Visit the website
2. Click the **"📱 Install App"** button in the header
3. Or click the install icon in the browser's address bar
4. Confirm the installation

### Mobile (iOS Safari)

1. Visit the website
2. Tap the Share button
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

### Mobile (Android Chrome)

1. Visit the website
2. Tap the **"📱 Install App"** button
3. Or tap the menu (three dots) and select "Install app"
4. Tap "Install"

## Offline Functionality

Once installed, the app will:

- Load instantly even without internet connection
- Cache all visited pages and resources
- Show offline indicator when network is unavailable
- Automatically sync when connection is restored

## Technical Details

### Configuration

- **Plugin**: `vite-plugin-pwa`
- **Service Worker Strategy**: GenerateSW (auto-generated)
- **Update Strategy**: Auto-update with user prompt
- **Cache Strategy**: Cache-first for fonts, network-first for pages

### Files Added/Modified

- `vite.config.ts` - PWA plugin configuration
- `src/main.tsx` - Service worker registration
- `src/components/HomePage.tsx` - Install button and offline indicator
- `src/styles/HomePage.css` - PWA UI styles with responsive design
- `src/vite-env.d.ts` - TypeScript type definitions
- `index.html` - PWA meta tags and optimized viewport settings
- All CSS files - Enhanced with comprehensive responsive design

### Build Output

The build process generates:

- `dist/sw.js` - Service worker file
- `dist/manifest.webmanifest` - App manifest
- `dist/workbox-*.js` - Workbox runtime

## Testing

### Development Mode

```bash
yarn dev
```

The PWA features are enabled in dev mode for testing.

### Production Build

```bash
yarn build
yarn preview
```

Test the production build with full PWA functionality.

### Testing Offline Mode

1. Open the app in browser
2. Open DevTools (F12)
3. Go to Network tab
4. Select "Offline" from the throttling dropdown
5. Refresh the page - it should still work!

## Browser Support

PWA features are supported in:

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Opera
- ✅ Samsung Internet

## Best Practices

1. **Always use HTTPS** in production (required for service workers)
2. **Test offline functionality** regularly
3. **Keep service worker updated** by rebuilding after changes
4. **Monitor cache size** to avoid storage issues
5. **Provide clear offline feedback** to users

## Troubleshooting

### Install button not showing?

- Make sure you're using HTTPS (or localhost)
- The app might already be installed
- Try a different browser
- Clear browser cache and reload

### Offline mode not working?

- Rebuild the app: `yarn build`
- Clear service worker cache in DevTools
- Unregister old service workers
- Check browser console for errors

### Updates not appearing?

- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear service worker cache
- Accept the update prompt when it appears

## Future Enhancements

Consider adding:

- Push notifications
- Background sync
- Periodic background sync
- More advanced caching strategies
- Offline form submissions with sync
- Install instructions modal
- Update toast notifications
