# NoNote Landing

Production landing page for [NoNote](https://github.com/tomy128/NoNote), built with native HTML, CSS and JavaScript.

## Development

Requires Node.js 20 or newer. There are no third-party runtime or build dependencies.

```bash
npm run dev
```

Open <http://localhost:4173>.

## Build

```bash
SITE_URL=https://nonote.example npm run build
```

The deployable site is written to `dist/`.

## Check

```bash
npm run check
```

Content is maintained in `src/content/`. Do not edit `dist/` directly. See [deployment](docs/deployment.md) and the [design specification](docs/superpowers/specs/2026-07-27-landing-page-design.md).
