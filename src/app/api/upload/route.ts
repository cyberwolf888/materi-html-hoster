import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ID_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const UPLOAD_DIRECTORY = path.join(process.cwd(), "public", "uploads");

export const runtime = "nodejs";

function generateId() {
  const bytes = randomBytes(6);

  return Array.from(bytes, (value) => ID_CHARACTERS[value % ID_CHARACTERS.length])
    .join("")
    .slice(0, 6);
}

function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Please upload one HTML file.", 400);
    }

    if (file.type !== "text/html") {
      return errorResponse("Only text/html files are allowed.", 400);
    }

    if (file.size === 0) {
      return errorResponse("The uploaded file is empty.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("Files must be 5MB or smaller.", 413);
    }

    const htmlContent = await file.text();
    await mkdir(UPLOAD_DIRECTORY, { recursive: true });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const id = generateId();
      const filePath = path.join(UPLOAD_DIRECTORY, `${id}.html`);

      try {
        await writeFile(filePath, htmlContent, {
          encoding: "utf8",
          flag: "wx",
        });

        return Response.json({ id, url: `/${id}` });
      } catch (error) {
        if (hasErrorCode(error) && error.code === "EEXIST") {
          continue;
        }

        throw error;
      }
    }

    return errorResponse("Could not generate a unique URL. Please try again.", 500);
  } catch {
    return errorResponse("Upload failed. Please try again.", 500);
  }
}
