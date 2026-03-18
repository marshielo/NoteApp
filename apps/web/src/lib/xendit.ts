/**
 * Xendit API client for server-side payment operations.
 * Uses Xendit Invoice API for multi-method payment support.
 */

const XENDIT_BASE_URL = 'https://api.xendit.co';

function getAuthHeader(): string {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error('XENDIT_SECRET_KEY not configured');
  return `Basic ${Buffer.from(key + ':').toString('base64')}`;
}

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  description: string;
  payerEmail: string;
  currency?: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
  invoiceDuration?: number; // seconds, default 86400 (24h)
  metadata?: Record<string, string>;
}

export interface XenditInvoice {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  currency: string;
}

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING';
  amount: number;
  paid_amount?: number;
  payer_email?: string;
  description?: string;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
  currency?: string;
  bank_code?: string;
  merchant_name?: string;
  created?: string;
  updated?: string;
}

/**
 * Create a Xendit invoice (payment page).
 * Supports: bank transfer, e-wallets (GoPay, OVO, DANA, ShopeePay), cards, QRIS.
 */
export async function createInvoice(params: CreateInvoiceParams): Promise<XenditInvoice> {
  const res = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      description: params.description,
      payer_email: params.payerEmail,
      currency: params.currency || 'IDR',
      success_redirect_url: params.successRedirectUrl,
      failure_redirect_url: params.failureRedirectUrl,
      invoice_duration: params.invoiceDuration || 86400,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Xendit API error: ${res.status} - ${JSON.stringify(err)}`);
  }

  return res.json();
}

/**
 * Verify webhook callback token.
 * Xendit sends x-callback-token header that must match the configured token.
 * For development, we also check the secret key.
 */
export function verifyWebhookSignature(callbackToken: string): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN || process.env.XENDIT_SECRET_KEY;
  if (!expectedToken) return false;
  return callbackToken === expectedToken;
}
