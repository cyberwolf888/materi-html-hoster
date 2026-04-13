import { S3Client } from "@aws-sdk/client-s3";

type R2EnvironmentVariable =
  | "R2_ACCOUNT_ID"
  | "R2_ACCESS_KEY_ID"
  | "R2_SECRET_ACCESS_KEY"
  | "R2_BUCKET_NAME";

function getEnvironmentVariable(name: R2EnvironmentVariable) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getR2BucketName() {
  return getEnvironmentVariable("R2_BUCKET_NAME");
}

let r2Client: S3Client | undefined;

export function getR2Client() {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${getEnvironmentVariable("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getEnvironmentVariable("R2_ACCESS_KEY_ID"),
        secretAccessKey: getEnvironmentVariable("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  return r2Client;
}
