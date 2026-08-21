/**
 * Helper utilities for resolving and formatting Twitch streamer information,
 * subscription details, financial data, and date timestamps across GDPR CSV export files.
 */

export interface NormalizedSubInfo {
  channel: string;
  channelUrl: string;
  tier: string;
  tierCode: string;
  isPrime: boolean;
  isMultiMonth: boolean;
  tenureMonths: number;
  isCumulativeTenure: boolean;
  streakMonths: number;
  isGift: boolean;
  isGiftSent: boolean;
  isGiftReceived: boolean;
  gifterName?: string;
  recipientName?: string;
  giftCount: number;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  status: string;
  isActive: boolean;
  price?: number;
  currency: string;
  formattedPrice?: string;
  paymentMethod?: string;
  orderId?: string;
  rawRow: Record<string, any>;
}

export function extractStreamerName(row: Record<string, any>, fallback = 'Twitch Channel'): string {
  if (!row || typeof row !== 'object') return fallback;

  const candidateKeys = [
    'channel_name',
    'channel',
    'broadcaster_login',
    'broadcaster_name',
    'channel_login',
    'channel_display_name',
    'streamer',
    'streamer_name',
    'broadcaster',
    'to_user_name',
    'to_broadcaster_user_id',
    'channel_id',
    'target_channel',
    'recipient',
    'target_user'
  ];

  for (const key of candidateKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const clean = String(val).trim();
      // If it's a numeric ID alone, check if there are better named keys first
      if (/^\d+$/.test(clean) && clean.length > 5) {
        // try to find a named one
        continue;
      }
      return clean;
    }
  }

  // Second pass in case only numeric ID exists
  for (const key of candidateKeys) {
    const val = row[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }

  return fallback;
}

export function extractSubscriptionTier(row: Record<string, any>): {
  tierCode: string;
  label: string;
  isPrime: boolean;
  isMultiMonth: boolean;
  costEstimate: number;
} {
  const rawTier = String(
    row.tier ||
      row.sub_plan ||
      row.tier_name ||
      row.plan ||
      row.plan_name ||
      row.subscription_type ||
      row.sub_type ||
      row.type ||
      row.benefit_type ||
      row.product_name ||
      row.product_id ||
      'Tier 1'
  ).trim();

  const lower = rawTier.toLowerCase();

  if (lower.includes('prime') || lower === '100') {
    return {
      tierCode: 'Prime',
      label: 'Prime Gaming',
      isPrime: true,
      isMultiMonth: false,
      costEstimate: 0
    };
  }

  if (lower.includes('3000') || lower.includes('tier 3') || lower.includes('tier3') || lower === '3') {
    return {
      tierCode: '3000',
      label: 'Tier 3 ($24.99)',
      isPrime: false,
      isMultiMonth: false,
      costEstimate: 24.99
    };
  }

  if (lower.includes('2000') || lower.includes('tier 2') || lower.includes('tier2') || lower === '2') {
    return {
      tierCode: '2000',
      label: 'Tier 2 ($9.99)',
      isPrime: false,
      isMultiMonth: false,
      costEstimate: 9.99
    };
  }

  const isMulti = lower.includes('multi') || lower.includes('3-month') || lower.includes('6-month');

  return {
    tierCode: '1000',
    label: isMulti ? 'Tier 1 (Multi-Month)' : 'Tier 1 ($4.99)',
    isPrime: false,
    isMultiMonth: isMulti,
    costEstimate: 4.99
  };
}

export function extractNormalizedSub(row: Record<string, any>): NormalizedSubInfo {
  const channel = extractStreamerName(row, 'Twitch Streamer');
  const tierInfo = extractSubscriptionTier(row);

  const isCumulativeTenure = Boolean(row.tenure_months || row.cumulative_months || row.streak_months || row.tenure);
  const tenure = Number(
    row.tenure_months ||
      row.cumulative_months ||
      row.streak_months ||
      row.tenure ||
      row.months ||
      row.duration_months ||
      1
  );
  const tenureMonths = isNaN(tenure) || tenure <= 0 ? 1 : tenure;

  const streak = Number(row.streak_months || row.streak || row.current_streak || tenureMonths);
  const streakMonths = isNaN(streak) ? tenureMonths : streak;

  // Gift Detection
  const isGiftFlag =
    row.is_gift === true ||
    String(row.is_gift).toLowerCase() === 'true' ||
    String(row.is_gift) === '1' ||
    String(row.gift).toLowerCase() === 'true' ||
    Boolean(row.gift_recipient) ||
    Boolean(row.gifted_to) ||
    Boolean(row.recipient_name) ||
    Boolean(row.recipient_user_name) ||
    Boolean(row.gifted_by) ||
    Boolean(row.gifter);

  const recipientName =
    row.gift_recipient ||
    row.recipient_name ||
    row.recipient_user_name ||
    row.recipient_display_name ||
    row.gifted_to ||
    undefined;

  const gifterName =
    row.gifted_by ||
    row.gifter ||
    row.gift_sender_name ||
    row.gift_sender_login ||
    row.sender_name ||
    undefined;

  const giftCount = Number(row.gift_count || row.quantity || row.count || 1);

  // If there is a recipient name specified, the user likely gifted it to someone else
  const isGiftSent = Boolean(recipientName);
  const isGiftReceived = isGiftFlag && Boolean(gifterName);

  // Dates
  const startDateStr = row.started_at || row.start_date || row.created_at || row.purchased_at || row.timestamp || row.date || row.start_timestamp || row.started;
  const endDateStr = row.ended_at || row.end_date || row.expires_at || row.expiration_date || row.cancelled_at || row.end_timestamp || row.ended || row.expiration;
  const renewalDateStr = row.renewal_date || row.next_billing_date || row.period_end || row.next_charge_date;

  // Status Detection & Date Math
  const rawStatus = row.status || row.state;
  const lowerStatus = rawStatus ? String(rawStatus).toLowerCase() : '';
  
  let isActive = false;
  if (lowerStatus.includes('active') || lowerStatus.includes('valid') || lowerStatus.includes('ongoing')) {
    isActive = true;
  } else if (!lowerStatus.includes('expire') && !lowerStatus.includes('cancel') && !endDateStr) {
    isActive = true;
  }

  // Force expiration if the real end date is in the past.
  // This solves the bug where historical transactions are treated as perpetually active.
  const now = new Date();
  let realEndDate: Date | null = null;
  
  if (endDateStr) {
    realEndDate = new Date(endDateStr);
  } else if (startDateStr) {
    const sDate = new Date(startDateStr);
    if (!isNaN(sDate.getTime())) {
      let monthsToAdd = tierInfo.isMultiMonth ? 3 : 1;
      const txDuration = Number(row.duration_months || row.months || monthsToAdd);
      const validTxDuration = isNaN(txDuration) || txDuration <= 0 ? monthsToAdd : txDuration;
      
      sDate.setMonth(sDate.getMonth() + validTxDuration);
      realEndDate = sDate;
    }
  }

  if (realEndDate && !isNaN(realEndDate.getTime())) {
    if (realEndDate < now) {
      isActive = false;
    }
  }

  const startDate = startDateStr;
  const endDate = endDateStr;
  const renewalDate = renewalDateStr;

  // Financial
  const rawPrice = Number(row.price || row.cost || row.amount || row.total_amount || 0);
  const price = isNaN(rawPrice) || rawPrice === 0 ? tierInfo.costEstimate : rawPrice;
  const currency = String(row.currency || 'USD').toUpperCase();
  const paymentMethod = row.payment_method || row.payment_provider || row.payment_type;
  const orderId = row.order_id || row.invoice_id || row.transaction_id || row.id;

  const formattedPrice = price > 0 ? formatCurrency(price, currency) : tierInfo.label;

  return {
    channel,
    channelUrl: `https://twitch.tv/${channel.toLowerCase()}`,
    tier: tierInfo.label,
    tierCode: tierInfo.tierCode,
    isPrime: tierInfo.isPrime,
    isMultiMonth: tierInfo.isMultiMonth,
    tenureMonths,
    isCumulativeTenure,
    streakMonths,
    isGift: isGiftFlag,
    isGiftSent,
    isGiftReceived,
    gifterName,
    recipientName,
    giftCount: isNaN(giftCount) ? 1 : giftCount,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    renewalDate: renewalDate ? String(renewalDate) : undefined,
    status: isActive ? 'Active' : rawStatus || 'Expired',
    isActive,
    price,
    currency,
    formattedPrice,
    paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
    orderId: orderId ? String(orderId) : undefined,
    rawRow: row
  };
}

export function formatTwitchDate(dateString: string | number | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateString);
  }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  const curr = currency.toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)} ${curr}`;
  }
}

/**
 * Returns a high contrast avatar gradient for a streamer channel name
 */
export function getStreamerAvatarColor(channel: string): string {
  const colors = [
    'from-[#9146FF] to-[#6441a5]',
    'from-indigo-600 to-purple-700',
    'from-violet-600 to-fuchsia-700',
    'from-cyan-600 to-blue-700',
    'from-emerald-600 to-teal-700',
    'from-rose-600 to-pink-700',
    'from-amber-600 to-orange-700'
  ];
  let hash = 0;
  for (let i = 0; i < channel.length; i++) {
    hash = channel.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
