import { GetObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";

import { getR2BucketName, getR2Client } from "@/lib/r2";

const ID_PATTERN = /^[A-Za-z0-9]{6}$/;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isMissingObject(error: unknown) {
  return (
    error instanceof S3ServiceException &&
    (error.name === "NoSuchKey" || error.$metadata.httpStatusCode === 404)
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
  try {
    const response = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getR2BucketName(),
        Key: `${id}.html`,
      }),
    );
    const htmlContent = await response.Body?.transformToString();

    if (htmlContent === undefined) {
      return new Response("Internal Server Error", { status: 500 });
    }

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    if (isMissingObject(error)) {
      return new Response("Not Found", { status: 404 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
