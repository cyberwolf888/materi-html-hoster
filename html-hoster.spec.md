# Feature: HTML File Hosting and Dynamic Display

**Goal:** 
Build a simple application where users can drag and drop an `.html` file, upload it, and instantly receive a short, randomly generated URL to view that HTML file rendered in their browser.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, TypeScript.

**Implementation Requirements:**

1. **Upload Interface (`src/app/page.tsx`)**:
   - Create a clean, modern drag-and-drop zone using Tailwind CSS.
   - Restrict file inputs to strictly `.html` files.
   - When a file is dropped, read it and send a `POST` request using `FormData` to `/api/upload`.
   - Display a loading spinner during the upload phase.
   - On success, display the generated URL (e.g., `http://localhost:3000/aB3x9Q`) alongside a "Copy to Clipboard" button.

2. **Upload API Route (`src/app/api/upload/route.ts`)**:
   - Create a `POST` Route Handler to parse the incoming `multipart/form-data`.
   - Validate that the uploaded file exists and has a `text/html` mime type.
   - Generate a random 6-character alphanumeric ID.
   - Extract the text content from the HTML file.
   - **Storage:** Save the file content to a local directory `/public/uploads/[id].html` (Note: Use `@vercel/blob` or a database if targeting serverless deployment, but use local `fs.promises` for this MVP).
   - Return a JSON response containing `{ id: "aB3x9Q", url: "/aB3x9Q" }`.

3. **Dynamic Display Route (`src/app/[id]/route.ts`)**:
   - Create a `GET` Route Handler for the dynamic segment.
   - Read the stored HTML file associated with the `[id]` parameter.
   - If the file is not found, return a `new Response("Not Found", { status: 404 })`.
   - If found, return the raw HTML string directly to the browser:
     `return new Response(htmlContent, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })`
   
**Edge Cases to Handle:**
- Prevent uploading files larger than 5MB.
- Graceful error handling in the UI if the upload fails.