import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const s3Client = new S3Client({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  region: 'us-east-1', // DigitalOcean Spaces uses us-east-1
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.DO_SPACES_BUCKET_NAME!;

export interface UploadResult {
  url: string;
  key: string;
}

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly accessible
    },
  });

  await upload.done();

  const url = `${process.env.DO_SPACES_ENDPOINT}/${BUCKET_NAME}/${key}`;
  
  return { url, key };
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export function getFileKey(id: string, size: 'original' | 'medium' | 'thumb', extension: string): string {
  return `${size}/${id}.${extension}`;
} 