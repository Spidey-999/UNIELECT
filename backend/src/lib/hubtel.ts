type HubtelSendSmsParams = {
  clientId: string;
  clientSecret: string;
  from: string;
  to: string;
  content: string;
  baseUrl?: string;
};

export async function sendHubtelSms(params: HubtelSendSmsParams): Promise<void> {
  const baseUrl = params.baseUrl || 'https://smsc.hubtel.com/v1/messages/send';

  const url =
    `${baseUrl}` +
    `?From=${encodeURIComponent(params.from)}` +
    `&To=${encodeURIComponent(params.to)}` +
    `&Content=${encodeURIComponent(params.content)}` +
    `&ClientId=${encodeURIComponent(params.clientId)}` +
    `&ClientSecret=${encodeURIComponent(params.clientSecret)}`;

  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Hubtel SMS send failed (${resp.status}): ${body}`);
  }
}
