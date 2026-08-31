import { isMobile } from './utils';

let analyticsUrl = '';

export function initAnalytics(baseUrl: string) {
  analyticsUrl = `${baseUrl}/api/analytics`;
}

export function trackEvent(merchantId: string, eventType: 'impression' | 'click', notificationEntryId?: string) {
  if (!analyticsUrl) return;
  const payload = JSON.stringify({
    merchantId,
    notificationEntryId: notificationEntryId || null,
    eventType,
    page: window.location.pathname,
    device: isMobile() ? 'mobile' : 'desktop',
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(analyticsUrl, new Blob([payload], { type: 'text/plain' }));
  }
}
