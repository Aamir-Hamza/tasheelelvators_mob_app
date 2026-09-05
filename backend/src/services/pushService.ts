const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK = 100;

type ExpoTicket = {
  status?: string;
  message?: string;
  details?: { error?: string };
};

function isExpoToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

async function sendChunk(
  messages: {
    to: string;
    title: string;
    body: string;
    sound: 'default';
    channelId: string;
    priority: 'high';
    ttl: number;
    data: Record<string, string>;
  }[]
) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Expo push failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: ExpoTicket[] | ExpoTicket };
  const raw = json.data;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

export async function sendExpoPush(input: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const tokens = [...new Set(input.tokens.filter(isExpoToken))];
  if (!tokens.length) {
    console.warn('Push skipped: no Expo push tokens on admin/technician accounts');
    return { sent: 0, invalid: [] as string[] };
  }

  const invalid: string[] = [];
  let sent = 0;

  for (let i = 0; i < tokens.length; i += CHUNK) {
    const slice = tokens.slice(i, i + CHUNK);
    const tickets = await sendChunk(
      slice.map((to) => ({
        to,
        title: input.title,
        body: input.body.slice(0, 240),
        sound: 'default' as const,
        channelId: 'default',
        priority: 'high' as const,
        ttl: 3600,
        data: input.data || {},
      }))
    );
    tickets.forEach((ticket, index) => {
      if (ticket.status === 'ok') {
        sent += 1;
        return;
      }
      console.error('Expo push ticket error', slice[index]?.slice(0, 24), ticket.message || ticket.details);
      if (ticket.details?.error === 'DeviceNotRegistered') {
        invalid.push(slice[index]);
      }
    });
  }

  return { sent, invalid };
}
