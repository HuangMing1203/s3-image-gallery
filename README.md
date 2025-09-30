# S3 Image Gallery

A static React website that displays an image gallery from a public AWS S3 file list (bucket XML).

## How to Use

1. Build and deploy the site (see below).
2. Paste your S3 file list URL (should return XML, e.g., `https://s3.amazonaws.com/my-bucket?list-type=2`) into the input.
3. The gallery will show all image files found.

## Development

```
npm install
npm run dev
```

## Build for GitHub Pages

```
npm run build
# Serve with any static file server, or deploy `dist/` to GitHub Pages.
```

## Deploy to GitHub Pages

- This template is ready for static deployment. You can use GitHub Actions or upload the `dist/` folder manually.
- Set the Pages source to `/dist` if using GitHub Pages static hosting.

---

**Security Notice:** Only use this with public, non-sensitive S3 buckets.