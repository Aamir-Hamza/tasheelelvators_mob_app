import { env } from '../config/env';

export async function uploadFaultImage(mediaUrl?: string): Promise<string | undefined> {
  if (!mediaUrl) return undefined;
  if (/^https?:\/\//i.test(mediaUrl)) return mediaUrl;

  const cloud = env.cloudinaryCloudName;
  const preset = env.cloudinaryUploadPreset;
  if (!cloud || !preset) return mediaUrl;

  const body = new FormData();
  body.append('file', mediaUrl);
  body.append('upload_preset', preset);
  body.append('folder', 'tasheel/faults');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST',
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { secure_url?: string };
  return json.secure_url || mediaUrl;
}
