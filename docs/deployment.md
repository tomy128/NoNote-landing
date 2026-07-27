# Deployment

NoNote Landing produces a static `dist/` directory and can be hosted by any service that preserves `/en/` and `/zh-CN/` paths.

## Production build

```bash
SITE_URL=https://your-domain.example NODE_ENV=production npm run build
npm run check
```

`SITE_URL` must be the public HTTPS origin without a path suffix. It generates canonical URLs, language alternates, Open Graph URLs, JSON-LD and the sitemap.

## Release updates

Download metadata lives in `src/content/releases.json`. Update it only after a complete public GitHub Release exists with all three assets:

- `NoNote_<version>_macos_aarch64.dmg`
- `NoNote_<version>_macos_x86_64.dmg`
- `NoNote_<version>_windows_x86_64-setup.exe`

Verify the tag, asset names, sizes and download links. Do not publish a partial platform set. Windows currently requires Windows 10 22H2 or newer. Do not claim a macOS minimum until release testing establishes it.

## Cache policy

- HTML, `robots.txt` and `sitemap.xml`: short cache or revalidation.
- Versioned images, CSS and JavaScript: cache after deployment validation. The current build does not fingerprint assets, so purge them when content changes.

## Rollback

Redeploy the previous known-good commit from the `landing` repository. Do not edit generated `dist/` files directly.

## Release checklist

- Run `npm run check`.
- Confirm the production domain in canonical and sitemap output.
- Test both languages.
- Test all three download links while authenticated and unauthenticated.
- Run keyboard and reduced-motion checks.
- Review mobile at 375px and desktop at 1440px.
- Confirm GitHub and license links.
