# Deployment

NoNote Landing generates a static `dist/` directory. The repository supports both Vercel and GitHub Pages, including a Pages project URL such as `https://tomy128.github.io/NoNote-landing/`.

## Before any deployment

```bash
npm ci
npm run check
```

The public release branch is `main`. The current development branch must be merged or pushed to `main` before Git-connected deployments can publish it.

## Vercel — recommended

Vercel is the shortest path when the site should use a custom apex domain or subdomain. `vercel.json` already declares:

- Build command: `npm run build`
- Output directory: `dist`
- Trailing-slash routes for `/en/` and `/zh-CN/`

### Dashboard setup

1. In Vercel, choose **Add New → Project**.
2. Import `tomy128/NoNote-landing`.
3. Keep the repository root as the project root.
4. Vercel reads `vercel.json`; no framework preset is required.
5. Deploy.

Vercel deployments automatically provide a deployment hostname, which the build uses when `SITE_URL` is absent.

For a stable production domain, add this Production environment variable after attaching the domain:

```text
SITE_URL=https://your-domain.example
```

Do not include a trailing slash, query, or hash. Use the same production URL for Preview only if previews should emit production canonical URLs.

### CLI alternative

```bash
npx vercel
npx vercel --prod
```

The dashboard Git integration is preferable because every pull request receives a Preview deployment and every `main` update can deploy automatically.

## GitHub Pages

`.github/workflows/deploy-pages.yml` builds and publishes `dist/` with the official Pages artifact workflow. It supports the repository subpath automatically.

### One-time repository setup

1. Push the deployment commit to the repository's `main` branch.
2. Open **GitHub → NoNote-landing → Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open **Actions** and run **Deploy landing to GitHub Pages**, or push another commit to `main`.
5. The default URL will be:

   ```text
   https://tomy128.github.io/NoNote-landing/
   ```

### GitHub Pages custom domain

Configure the domain in **Settings → Pages**. Then create an Actions repository variable:

```text
Name: SITE_URL
Value: https://your-domain.example
```

The workflow uses this variable for canonical URLs, language alternates, product metadata and the sitemap. A `CNAME` file alone does not configure the Pages domain.

## Production build contract

Local production build:

```bash
SITE_URL=https://your-domain.example NODE_ENV=production npm run build
```

For a GitHub Pages project path:

```bash
SITE_URL=https://tomy128.github.io/NoNote-landing NODE_ENV=production npm run build
```

The path portion of `SITE_URL` becomes the prefix for CSS, JavaScript, images, home links, locale links and the language redirect.

## Release updates

Download metadata lives in `src/content/releases.json`. Update it only after a complete public GitHub Release exists with all three installers:

- `NoNote_<version>_macos_aarch64.dmg`
- `NoNote_<version>_macos_x86_64.dmg`
- `NoNote_<version>_windows_x86_64-setup.exe`

Verify the tag, asset names, download URLs and supported operating-system claims before deploying.

## Cache and rollback

- HTML, `robots.txt` and `sitemap.xml`: revalidate or use a short cache.
- Images, CSS and JavaScript are not fingerprinted; purge the deployment cache when replacing assets.
- Roll back by redeploying the previous known-good commit. Do not edit generated `dist/` files directly.

## Release checklist

- `npm run check` passes.
- Canonical URLs and sitemap use the final production domain and path.
- `/`, `/en/`, `/zh-CN/`, CSS, JavaScript and product images load directly.
- All installer links work in an unauthenticated browser.
- Keyboard navigation and reduced-motion behavior work.
- Mobile at 375px and desktop at 1440px have been reviewed.
- Raw product captures are absent from `dist/`.
