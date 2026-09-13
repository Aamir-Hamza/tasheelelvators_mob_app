import { env } from '../config/env';

export async function uploadFaultImage(mediaUrl?: string): Promise<string | undefined> {
  if (!mediaUrl) return undefined;
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;

  const cloud = env.cloudinaryCloudName;
  const preset = env.cloudinaryUploadPreset;
  if (!cloud || !preset) return mediaUrl;

  const body = new URLSearchParams();
  body.set('file', mediaUrl);
  body.set('upload_preset', preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Cloudinary upload failed', res.status, text.slice(0, 300));
    return mediaUrl;
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url) return mediaUrl;
  return json.secure_url.replace('/upload/', '/upload/c_limit,w_1400,q_auto,f_auto/');
}
