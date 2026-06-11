import { WidgetNotification, WidgetSettings } from './api';
import { fillTemplate, timeAgo } from './utils';
import { trackEvent } from './analytics';

// --- Safe DOM helpers ---

function el(tag: string, className?: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function closeBtn(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'sn-close';
  btn.setAttribute('aria-label', 'Close');
  btn.textContent = '×'; // multiplication sign (x)
  return btn;
}

function safeImg(src: string, className: string): HTMLImageElement | null {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }
  } catch {
    return null;
  }
  const img = document.createElement('img');
  img.src = src;
  img.className = className;
  img.alt = '';
  img.loading = 'lazy';
  return img;
}

// --- Theme builders ---

function buildClassic(title: string, productName: string, meta: string, imageUrl: string | null): HTMLElement {
  const wrapper = el('div', 'sn-classic');

  if (imageUrl) {
    const img = safeImg(imageUrl, 'sn-classic-img');
    if (img) wrapper.appendChild(img);
  }

  const content = el('div', 'sn-classic-content');
  content.appendChild(el('div', 'sn-classic-title', title));
  content.appendChild(el('div', 'sn-classic-product', productName));
  content.appendChild(el('div', 'sn-classic-meta', meta));
  wrapper.appendChild(content);

  return wrapper;
}

function buildModern(title: string, productName: string, meta: string, imageUrl: string | null): HTMLElement {
  const wrapper = el('div', 'sn-modern');

  wrapper.appendChild(el('div', 'sn-modern-header', title));

  if (imageUrl) {
    const img = safeImg(imageUrl, 'sn-modern-img');
    if (img) wrapper.appendChild(img);
  }

  const footer = el('div', 'sn-modern-footer');
  footer.appendChild(el('div', 'sn-modern-product', productName));
  footer.appendChild(el('div', 'sn-modern-meta', meta));
  wrapper.appendChild(footer);

  return wrapper;
}

function buildMinimal(customerName: string, productName: string, location: string): HTMLElement {
  const wrapper = el('div', 'sn-minimal');

  wrapper.appendChild(el('span', 'sn-minimal-dot'));

  const textEl = el('span', 'sn-minimal-text');
  const nameStrong = el('strong', undefined, customerName);
  textEl.appendChild(nameStrong);
  textEl.appendChild(document.createTextNode(' '));

  const productStrong = el('strong', undefined, productName);
  textEl.appendChild(document.createTextNode(' satın aldı · '));
  textEl.appendChild(productStrong);

  if (location) {
    textEl.appendChild(document.createTextNode(` · ${location}`));
  }

  wrapper.appendChild(textEl);

  return wrapper;
}

// --- Main render / remove ---

export interface ToastHandle {
  element: HTMLElement;
  cancelled: boolean;
}

export function renderToast(
  root: ShadowRoot,
  notification: WidgetNotification,
  settings: WidgetSettings,
  merchantId: string,
): ToastHandle {
  const handle: ToastHandle = { element: null!, cancelled: false };

  const vars: Record<string, string> = {
    name: notification.customerName,
    product: notification.productName,
    location: notification.location,
    time: timeAgo(notification.purchaseDate),
  };

  const title = fillTemplate(settings.messageTemplate, vars);
  const meta = fillTemplate(settings.timeTemplate, vars);

  // Create toast container
  const toast = el('div', `sn-toast ${settings.position} sn-enter`);

  // Build inner content based on theme
  let inner: HTMLElement;
  if (settings.theme === 'modern') {
    inner = buildModern(title, notification.productName, meta, notification.productImage);
  } else if (settings.theme === 'minimal') {
    inner = buildMinimal(notification.customerName, notification.productName, notification.location);
  } else {
    inner = buildClassic(title, notification.productName, meta, notification.productImage);
  }

  toast.appendChild(inner);

  // Close button
  const close = closeBtn();
  close.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    handle.cancelled = true;
    removeToast(toast);
  });
  toast.appendChild(close);

  // Click handler — navigate to product
  toast.addEventListener('click', () => {
    trackEvent(merchantId, 'click', notification.id);
    if (notification.productHref) {
      window.open(notification.productHref, '_self');
    }
  });

  root.appendChild(toast);
  handle.element = toast;

  // Animate in with double-rAF trick for reliable transition
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.remove('sn-enter');
      toast.classList.add('sn-enter-active');
    });
  });

  return handle;
}

export function removeToast(toast: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    toast.classList.remove('sn-enter-active');
    toast.classList.add('sn-exit');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.classList.remove('sn-exit');
        toast.classList.add('sn-exit-active');
      });
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      resolve();
    }, 500);
  });
}
