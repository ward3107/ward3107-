import { MAX_IMAGE_CHARS } from './sanitize';

export const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;
const maxSourceBytes = 12 * 1024 * 1024;

export class ImageError extends Error {}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new ImageError('לא ניתן לקרוא את התמונה. יש לבחור קובץ PNG, JPEG או WebP תקין.');
  }
}

/**
 * Downscales a user image so that it fits comfortably in localStorage and in the printed
 * proposal. Logos keep transparency (PNG); renderings become JPEG.
 */
export async function prepareImage(file: File, kind: 'logo' | 'rendering'): Promise<string> {
  if (!(acceptedImageTypes as readonly string[]).includes(file.type)) {
    throw new ImageError('יש לבחור תמונת PNG, JPEG או WebP.');
  }
  if (file.size > maxSourceBytes) throw new ImageError('התמונה גדולה מדי. יש לבחור קובץ עד 12MB.');

  const bitmap = await loadBitmap(file);
  const maxSide = kind === 'logo' ? 480 : 1600;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('הדפדפן לא תומך בעיבוד תמונות.');
  if (kind === 'rendering') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const type = kind === 'logo' ? 'image/png' : 'image/jpeg';
  for (const quality of [0.86, 0.72, 0.58, 0.44]) {
    const url = canvas.toDataURL(type, quality);
    if (url.length <= MAX_IMAGE_CHARS) return url;
  }
  throw new ImageError('לא הצלחנו לכווץ את התמונה מספיק. יש לבחור תמונה קטנה יותר.');
}
