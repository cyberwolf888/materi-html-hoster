import { readFile } from "node:fs/promises";
import path from "node:path";

const ID_PATTERN = /^[A-Za-z0-9]{6}$/;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!ID_PATTERN.test(id)) {
    return new Response("Not Found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", `${id}.html`);

  try {
    const htmlContent = await readFile(filePath, "utf8");

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    if (hasErrorCode(error) && error.code === "ENOENT") {
      return new Response("Not Found", { status: 404 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
