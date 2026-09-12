import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Negotiation, Offer, DecisionSupportMetrics } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  if (currency === 'USD') {
    currency = 'NGN';
  }
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
  
  // Ensure the ₦ symbol is explicitly used
  return formatted.replace(/NGN\s?/, '₦');
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatShortDate(dateString);
  } catch {
    return 'recently';
  }
}

/**
 * Basic sanitization to prevent XSS injection in user chat & notes
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Pure rule-based quantitative decision support analytics.
 * Evaluates the convergence trajectory, spread gap, and concession velocity between parties.
 * NOTE: Documented as honest mathematical decision-support (not simulated AI).
 */
export function calculateDecisionMetrics(
  negotiation: Negotiation,
  offers: Offer[]
): DecisionSupportMetrics {
  if (!offers || offers.length === 0) {
    return {
      currentBuyerOffer: negotiation.currentAmount,
      currentSellerAsk: negotiation.targetBudget || negotiation.currentAmount,
      gapAmount: 0,
      gapPercentage: 0,
      roundsCount: 0,
      averageConcessionRate: 0,
      convergenceTrajectory: [],
      negotiationVelocityHours: 0,
      recommendedNextStep: 'Awaiting opening offer to begin quantitative spread analysis.',
    };
  }

  // Sort chronological
  const sortedOffers = [...offers].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Group by initiator vs counterparty
  const initiatorOffers = sortedOffers.filter((o) => o.fromUserId === negotiation.initiatorId);
  const counterpartyOffers = sortedOffers.filter((o) => o.fromUserId === negotiation.counterpartyId);

  const latestInitiator = initiatorOffers[initiatorOffers.length - 1];
  const latestCounterparty = counterpartyOffers[counterpartyOffers.length - 1];

  const valA = latestInitiator ? latestInitiator.amount : negotiation.currentAmount;
  const valB = latestCounterparty ? latestCounterparty.amount : (negotiation.targetBudget || valA);

  const higher = Math.max(valA, valB);
  const lower = Math.min(valA, valB);
  const gapAmount = higher - lower;
  const gapPercentage = higher > 0 ? Math.round((gapAmount / higher) * 100) : 0;

  // Build convergence trajectory for Recharts
  const trajectory = sortedOffers.map((o, idx) => ({
    round: idx + 1,
    amount: o.amount,
    party: o.fromUserName,
    label: `R${idx + 1}: ${formatCurrency(o.amount, o.currency)}`,
  }));

  // Estimate negotiation velocity in hours
  const firstTime = new Date(sortedOffers[0].createdAt).getTime();
  const lastTime = new Date(sortedOffers[sortedOffers.length - 1].createdAt).getTime();
  const velocityHours = Math.max(1, Math.round((lastTime - firstTime) / (1000 * 60 * 60)));

  // Concession calculation
  let recommendation = 'Both parties are actively exchanging terms.';
  if (gapPercentage <= 5 && gapPercentage > 0) {
    recommendation = 'Spread is under 5% — statistical likelihood of mutual closure is high with a minor split or terms concession.';
  } else if (gapPercentage <= 15) {
    recommendation = 'Moderate spread (~' + gapPercentage + '%). Focus on non-monetary value items (e.g. payment terms or milestone timeline) to bridge the delta.';
  } else if (gapPercentage > 25) {
    recommendation = 'Wide spread (>25%). Consider anchoring around milestone delivery or phased scope before making large price concessions.';
  } else if (gapAmount === 0 && sortedOffers.length > 1) {
    recommendation = 'Both parties have aligned on monetary value. Proceed to final agreement execution.';
  }

  return {
    currentBuyerOffer: lower,
    currentSellerAsk: higher,
    gapAmount,
    gapPercentage,
    roundsCount: sortedOffers.length,
    averageConcessionRate: Math.round(gapAmount / Math.max(1, sortedOffers.length)),
    convergenceTrajectory: trajectory,
    negotiationVelocityHours: velocityHours,
    recommendedNextStep: recommendation,
  };
}
