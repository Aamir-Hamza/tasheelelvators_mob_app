import { Platform } from 'react-native';

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.55;
const MAX_DATA_URL_CHARS = 3_500_000;

export async function shrinkPhotoDataUrl(dataUrl: string): Promise<string> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return dataUrl.length > MAX_DATA_URL_CHARS ? '' : dataUrl;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl.length > MAX_DATA_URL_CHARS ? '' : dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const next = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      resolve(next.length > MAX_DATA_URL_CHARS ? '' : next);
    };
    img.onerror = () => resolve(dataUrl.length > MAX_DATA_URL_CHARS ? '' : dataUrl);
    img.src = dataUrl;
  });
}

export function photoFitsPayload(dataUrl?: string) {
  return Boolean(dataUrl && dataUrl.length <= MAX_DATA_URL_CHARS);
}
