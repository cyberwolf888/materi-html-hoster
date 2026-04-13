import { randomBytes } from "node:crypto";
import { PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";

import { getR2BucketName, getR2Client } from "@/lib/r2";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ID_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const runtime = "nodejs";

function generateId() {
  const bytes = randomBytes(6);

  return Array.from(bytes, (value) => ID_CHARACTERS[value % ID_CHARACTERS.length])
    .join("")
    .slice(0, 6);
}

function isConditionalWriteConflict(error: unknown) {
  return (
    error instanceof S3ServiceException &&
    (error.name === "PreconditionFailed" || error.$metadata.httpStatusCode === 412)
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

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const id = generateId();
      const objectKey = `${id}.html`;

      try {
        await getR2Client().send(
          new PutObjectCommand({
            Bucket: getR2BucketName(),
            Key: objectKey,
            Body: htmlContent,
            ContentType: "text/html; charset=utf-8",
            IfNoneMatch: "*",
          }),
        );

        return Response.json({ id, url: `/${id}` });
      } catch (error) {
        if (isConditionalWriteConflict(error)) {
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
