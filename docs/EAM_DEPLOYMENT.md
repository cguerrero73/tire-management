# EAM Deployment Guide

## Overview

This document describes how to deploy the Tire Management Angular module into HxGN EAM using the Extensibility Framework (EF).

---

## Build Process

### 1. Build the Angular Application

```bash
# Full build (Angular + EAM bootstrap)
npm run build:all

# Or step by step:
npm run build          # Angular app → dist/browser/
npm run build:eam      # EAM bootstrap → dist-eam/
```

### 2. Output Structure

```
dist/
├── browser/           # Angular app (main bundle)
│   ├── index.html
│   ├── main-*.js
│   ├── polyfills-*.js
│   ├── styles-*.css
│   └── configs/       # Tenant configs (JSON)
│       ├── default/config.json
│       └── acme-corp/config.json
│
└── dist-eam/          # EAM bootstrap (standalone)
    └── tire-mgmt-bootstrap.js
```

---

## EAM Deployment

### 1. Copy Files to EAM Server

Copy the `dist/browser/` contents to a location accessible by EAM's web server.

**Typical EAM locations:**

| Environment        | Typical Path                                      |
| ------------------ | ------------------------------------------------- |
| Windows App Server | `C:\Program Files\HxGN\EAM\Web\custom\tire-mgmt\` |
| Linux App Server   | `/opt/eam/web/custom/tire-mgmt/`                  |

**Files to copy:**

```bash
# Example deployment command (adjust to your environment)
scp -r dist/browser/* eam-admin@eam-server:/opt/eam/web/custom/tire-mgmt/
```

### 2. Register the Screen in EAM

Screen registration is done through EAM's admin interface:

1. **Log in to EAM as System Administrator**

2. **Navigate to:** `System Configuration → Application Setup → Screens`

3. **Create a new Screen:**
   - **Screen Code:** `TIREMGMT`
   - **Description:** `Tire Management Module`
   - **Type:** `Standard`
   - **Extensible Framework JS:** `EAM.custom.external_TIREMGMT`
   - **URL/Function:** (link to your deployed `index.html` or use EF mounting)

4. **Register the screen to a menu** (optional):
   - Navigate to: `System Configuration → Menu Setup`
   - Add the screen to the desired menu

### 3. Alternative: Register via Database

For bulk/automated deployments, you can insert directly:

```sql
-- Example SQL (verify with your EAM version)
INSERT INTO screens (
    screen_code,
    description,
    extensible_framework_js,
    active
) VALUES (
    'TIREMGMT',
    'Tire Management Module',
    'EAM.custom.external_TIREMGMT',
    1
);
```

---

## Tenant Configuration

### Adding a New Tenant

1. **Create tenant config directory:**

   ```bash
   mkdir -p src/configs/{tenant-id}
   ```

2. **Copy and edit config:**

   ```bash
   cp src/configs/acme-corp/config.json src/configs/{tenant-id}/config.json
   # Edit with tenant-specific values
   ```

3. **Rebuild and redeploy:**
   ```bash
   npm run build:all
   # Copy updated configs to EAM server
   ```

### Config Values Reference

| Field                      | Description                            | Example                        |
| -------------------------- | -------------------------------------- | ------------------------------ |
| `tenant`                   | Unique tenant identifier               | `acme-corp`                    |
| `tenantName`               | Display name                           | `ACME Corporation`             |
| `environment`              | `development`, `staging`, `production` | `production`                   |
| `api.baseUrl`              | EAM backend base URL                   | `https://eam.acme.com`         |
| `api.systemFunctionPrefix` | Prefix for API calls                   | `TM`                           |
| `features.map.enabled`     | Enable map feature                     | `true`                         |
| `features.map.library`     | Map library                            | `openlayers`                   |
| `libraries[].id`           | Library identifier (unique)            | `openlayers`                   |
| `libraries[].url`          | CDN or local URL                       | `https://cdn.jsdelivr.net/...` |
| `libraries[].type`         | `js` or `css`                          | `js`                           |
| `libraries[].critical`     | Block bootstrap until loaded           | `true`                         |

---

## Verifying Deployment

### Check Bootstrap Loaded

Open browser DevTools → Console after opening the TIREMGMT screen:

```
[TireManagementEF] Stage: beforerender
[TireManagementEF] Detected tenant: acme-corp
[TireManagementEF] Config loaded: {tenant: "acme-corp", ...}
[TireManagementEF] Stage: afterrender
[App] Config initialized for tenant: acme-corp
```

### Common Issues

| Issue                            | Cause                              | Solution                                           |
| -------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `Ext is not defined`             | Bootstrap loads before EAM's ExtJS | Ensure EAM loads the screen via EF, not standalone |
| `Failed to load config`          | Config path incorrect              | Verify configs are in `dist/browser/configs/`      |
| `Tenant fallback to default`     | Tenant config not found            | Check tenant ID matches directory name             |
| `Library already loaded` warning | Normal (singleton pattern)         | Not an error                                       |

---

## Development Workflow

### Local Development with EAM

1. **Run Angular dev server:**

   ```bash
   npm start  # Serves on http://localhost:4200
   ```

2. **Configure EAM to point to local server:**
   - In your tenant config, set `api.baseUrl` to your EAM server
   - For local Angular testing without EAM, use `npm start` and mock config

3. **Debug with Angular DevTools:**
   ```bash
   # The bootstrap will use default config when not in EAM
   # Angular shows tenant: "default" in the UI
   ```

### Hot Reload

- Angular CLI serves with hot reload enabled
- EAM bootstrap is NOT hot-reloaded (full rebuild required)
- For rapid iteration, consider testing components in isolation first

---

## Security Considerations

1. **Config files are public** — Do not store secrets in JSON configs
2. **API credentials** — Use EAM's session auth, not separate credentials
3. **CORS** — Ensure EAM backend allows requests from your Angular app domain
4. **Tenant isolation** — Server-side filtering by `tenant` param (handled by EAM)

---

## File: bootstrap.js (What EAM Loads)

The EAM bootstrap file defines the ExtJS component:

```javascript
// dist-eam/tire-mgmt-bootstrap.js
var Ext = Ext || {};
(function () {
  // ... ExtJS setup (copied from app.js for standalone operation)

  Ext.define('EAM.custom.external_TIREMGMT', {
    extend: 'EAM.custom.AbstractExtensibleFramework',
    getSelectors: function () {
      return {
        '[extensibleFramework] [tabName=LST]': {
          beforerender: this.onBeforeRender.bind(this),
          afterrender: this.onAfterRender.bind(this),
          afterlayout: this.onAfterLayout.bind(this),
        },
      };
    },
    // ... lifecycle methods
  });
})();
```

This file must be:

1. Deployed where EAM can serve it
2. Referenced in the screen's `extensible_framework_js` field
