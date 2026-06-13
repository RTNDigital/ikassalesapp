import { fetchWidgetData, WidgetData, WidgetNotification, WidgetSettings } from './api';
import { initAnalytics, trackEvent } from './analytics';
import { isMobile, shuffleArray } from './utils';
import { getThemeCSS } from './themes';
import { getAnimationCSS } from './animations';
import { renderToast, removeToast, ToastHandle } from './renderer';
import { renderTeaser } from './teaser';

(function () {
  // 1. Extract merchantId and baseUrl from script tag src
  const scriptEl = document.currentScript as HTMLScriptElement | null;
  if (!scriptEl) return;

  const scriptUrl = new URL(scriptEl.src);
  const merchantId = scriptUrl.searchParams.get('mid');
  if (!merchantId) return;

  const baseUrl = scriptUrl.origin;

  // 3. Init analytics
  initAnalytics(baseUrl);

  // Helper: delay
  function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function matchesRule(rule: { url: string; matchType: string }): boolean {
    const value = rule.url;
    if (!value) return false;
    const path = window.location.pathname;
    const fullUrl = window.location.href;
    switch (rule.matchType) {
      case 'exact':
        return fullUrl === value || path === value;
      case 'startsWith':
        return fullUrl.startsWith(value) || path.startsWith(value);
      case 'contains':
        return fullUrl.includes(value) || path.includes(value);
      default:
        return false;
    }
  }

  function isPageAllowed(settings: WidgetSettings): boolean {
    const targeting = settings.pageTargeting;
    if (targeting.mode === 'all') return true;
    if (!targeting.rules || targeting.rules.length === 0) return true;

    if (targeting.mode === 'excluded') {
      return !targeting.rules.some(matchesRule);
    }
    return targeting.rules.some(matchesRule);
  }

  // Helper: order notifications (prioritized first, then shuffled rest)
  function orderNotifications(notifications: WidgetNotification[]): WidgetNotification[] {
    const prioritized = notifications.filter((n) => n.isPrioritized);
    const rest = notifications.filter((n) => !n.isPrioritized);
    return [...prioritized, ...shuffleArray(rest)];
  }

  // Main initialization
  async function init() {
    // 4. Fetch widget data
    const data = await fetchWidgetData(baseUrl, merchantId!);
    if (!data) return;

    const { settings, notifications } = data;

    // 5. Check if active
    if (!settings.isActive) return;

    // Check mobile
    if (!settings.showOnMobile && isMobile()) return;

    // Check page targeting
    if (!isPageAllowed(settings)) return;

    // No notifications to show
    if (notifications.length === 0) return;

    // 6. Create Shadow DOM host
    const host = document.createElement('div');
    host.id = 'sn-widget-host';
    host.style.cssText = 'position:fixed;z-index:999999;pointer-events:none;top:0;left:0;width:0;height:0;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    // Inject CSS
    const style = document.createElement('style');
    style.textContent =
      getThemeCSS(settings.theme, settings.customColors) +
      getAnimationCSS(settings.animation, settings.position);
    shadow.appendChild(style);

    // Enable pointer events on actual toast elements inside shadow
    const pointerStyle = document.createElement('style');
    pointerStyle.textContent = '.sn-toast, .sn-teaser { pointer-events: auto; }';
    shadow.appendChild(pointerStyle);

    // 7. Order notifications
    const ordered = orderNotifications(notifications);

    // Track if teaser is shown alongside cycle (for "always" behavior)
    let teaserElement: HTMLElement | null = null;

    // 8. Run notification cycle
    async function runCycle() {
      // Remove existing teaser if any
      if (teaserElement && teaserElement.parentNode) {
        teaserElement.parentNode.removeChild(teaserElement);
        teaserElement = null;
      }

      const limit = Math.min(ordered.length, settings.maxPerPage);

      // Wait firstDelay before showing the first notification
      await delay(settings.firstDelay);

      for (let i = 0; i < limit; i++) {
        const notification = ordered[i];

        // Render toast
        const handle: ToastHandle = renderToast(shadow, notification, settings, merchantId!);

        // Track impression
        trackEvent(merchantId!, 'impression', notification.id);

        // Wait displayDuration, but respect early close
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            if (!handle.cancelled) {
              removeToast(handle.element).then(resolve);
            } else {
              resolve();
            }
          }, settings.displayDuration);

          // Poll for early cancellation
          const checkCancel = setInterval(() => {
            if (handle.cancelled) {
              clearTimeout(timer);
              clearInterval(checkCancel);
              resolve();
            }
          }, 100);
        });

        // Wait between notifications (but not after the last one)
        if (i < limit - 1) {
          await delay(settings.delayBetween);
        }
      }

      // 11. After cycle: show teaser if enabled
      if (settings.showTeaser && settings.teaserBehavior !== 'never') {
        teaserElement = renderTeaser(shadow, settings, runCycle);
      }
    }

    // 12. If teaserBehavior is "always", show teaser immediately alongside the cycle
    if (settings.showTeaser && settings.teaserBehavior === 'always') {
      teaserElement = renderTeaser(shadow, settings, runCycle);
    }

    runCycle();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
