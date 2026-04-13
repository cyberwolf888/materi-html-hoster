# Materi HTML Hoster

Upload a `.html` file, store it in Cloudflare R2, and open it again through a six-character URL.

## Environment Variables

Copy `.env.example` to `.env.local` for local development and fill in these values:

```bash
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

## Cloudflare R2 Setup

1. Create a Cloudflare account.
2. Create an R2 bucket for uploads.
3. Create an R2 API token with object read and write access.
4. Add the bucket name, account ID, access key ID, and secret access key to `.env.local`.

The app stores uploaded HTML files in R2 as `{id}.html` and reads them back through the server route at `/:id`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Deploy on Vercel

1. Import the project into Vercel.
2. Add the same four R2 environment variables in the Vercel project settings.
3. Deploy.

The upload and read routes run on Vercel, while file contents live in Cloudflare R2 instead of the local filesystem.
