import sharp from 'sharp';

export interface ResizeOptions {
  width: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const RESIZE_PRESETS = {
  medium: { width: 800, quality: 85 },
  thumb: { width: 200, quality: 80 },
} as const;

export async function resizeImage(
  inputBuffer: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  const { width, quality = 85, format = 'jpeg' } = options;

  let processor = sharp(inputBuffer)
    .rotate() // Automatically apply EXIF orientation
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

  if (format === 'jpeg') {
    processor = processor.jpeg({ quality });
  } else if (format === 'png') {
    processor = processor.png({ quality });
  } else if (format === 'webp') {
    processor = processor.webp({ quality });
  }

  return processor.toBuffer();
}

export async function generateResizedVersions(originalBuffer: Buffer): Promise<{
  medium: Buffer;
  thumb: Buffer;
}> {
  const [medium, thumb] = await Promise.all([
    resizeImage(originalBuffer, RESIZE_PRESETS.medium),
    resizeImage(originalBuffer, RESIZE_PRESETS.thumb),
  ]);

  return { medium, thumb };
}

export function getImageFormat(filename: string): 'jpeg' | 'png' | 'webp' {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'jpeg';
  }
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || 'jpg';
} 