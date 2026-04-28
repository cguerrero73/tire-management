# TireManagement

Angular module for HxGN EAM tire management, deployed via Extensibility Framework (EF).

## Architecture

```
src/
├── eam/                    # EAM EF Bootstrap
│   ├── bootstrap.ts        # Entry point for EAM
│   └── config.loader.ts    # Tenant config loader
├── core/                   # Core services & adapters
│   ├── adapters/           # EAM adapter (session, headers)
│   ├── services/           # API, config, tenant, library-loader
│   └── models/             # TypeScript + Zod schemas
├── configs/                # Tenant-specific configs
│   ├── default/            # Fallback config
│   └── {tenant-id}/        # Per-tenant overrides
└── app/                    # Angular application
```

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build:all
```

## EAM Deployment

See [EAM Deployment Guide](docs/EAM_DEPLOYMENT.md) for:

- Build output structure
- Server deployment steps
- Screen registration in EAM
- Tenant configuration

## Key Commands

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm start`         | Dev server at localhost:4200 |
| `npm run build`     | Angular app → dist/browser/  |
| `npm run build:eam` | EAM bootstrap → dist-eam/    |
| `npm run build:all` | Both builds combined         |
| `npm test`          | Unit tests                   |

## Multi-Tenant Support

Configs live in `src/configs/{tenant-id}/config.json`. Add new tenants without code changes:

```bash
mkdir src/configs/new-client
cp src/configs/acme-corp/config.json src/configs/new-client/
# Edit config.json with tenant values
```

## EAM Integration Points

- **Session/Tenant**: `EAMAdapter.getTenant()`, `getSessionId()`
- **HTTP Headers**: `Request-Type: XMLHTTP`, params: `eamid`, `tenant`
- **URL Pattern**: `{systemFunction}.xmlhttp`, `{systemFunction}.EVT.xmlhttp`
