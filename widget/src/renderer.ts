import { WidgetNotification, WidgetSettings } from './api';
import { fillTemplate, timeAgo } from './utils';
import { trackEvent } from './analytics';

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
  btn.textContent = '×';
  return btn;
}

function safeImg(src: string, className: string): HTMLImageElement | null {
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
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

function buildClassic(
  notification: WidgetNotification,
  _title: string,
  meta: string,
  hasProductLink: boolean,
): HTMLElement {
  const wrapper = el('div', 'sn-inner');

  if (notification.productImage) {
    const imgWrap = el('div', 'sn-img-wrap');
    const img = safeImg(notification.productImage, 'sn-img');
    if (img) imgWrap.appendChild(img);
    wrapper.appendChild(imgWrap);
  }

  const content = el('div', 'sn-content');

  const nameRow = el('div', 'sn-name');
  nameRow.appendChild(el('strong', undefined, notification.customerName));
  nameRow.appendChild(document.createTextNode(' satın aldı'));
  content.appendChild(nameRow);

  content.appendChild(el('div', 'sn-product', notification.productName));

  const bottom = el('div', 'sn-bottom');
  bottom.appendChild(el('span', 'sn-meta', meta));
  if (hasProductLink) {
    bottom.appendChild(el('span', 'sn-cta', 'Ürünü Gör'));
  }
  content.appendChild(bottom);

  wrapper.appendChild(content);
  return wrapper;
}

function buildModern(
  notification: WidgetNotification,
  _title: string,
  meta: string,
  hasProductLink: boolean,
): HTMLElement {
  const wrapper = el('div', 'sn-inner sn-modern');

  if (notification.productImage) {
    const imgWrap = el('div', 'sn-img-wrap');
    const img = safeImg(notification.productImage, 'sn-img');
    if (img) imgWrap.appendChild(img);
    wrapper.appendChild(imgWrap);
  }

  const content = el('div', 'sn-content');

  const nameRow = el('div', 'sn-name');
  nameRow.appendChild(el('strong', undefined, notification.customerName));
  nameRow.appendChild(document.createTextNode(' satın aldı'));
  content.appendChild(nameRow);

  content.appendChild(el('div', 'sn-product', notification.productName));

  const bottom = el('div', 'sn-bottom');
  bottom.appendChild(el('span', 'sn-meta', meta));
  if (hasProductLink) {
    bottom.appendChild(el('span', 'sn-cta', 'Ürünü Gör'));
  }
  content.appendChild(bottom);

  wrapper.appendChild(content);
  return wrapper;
}

function buildMinimal(
  notification: WidgetNotification,
  meta: string,
): HTMLElement {
  const wrapper = el('div', 'sn-inner sn-minimal-inner');

  const dot = el('span', 'sn-dot');
  wrapper.appendChild(dot);

  const content = el('div', 'sn-content');
  const textEl = el('div', 'sn-title');
  textEl.appendChild(el('strong', undefined, notification.customerName));
  textEl.appendChild(document.createTextNode(` ${notification.productName} satın aldı`));
  content.appendChild(textEl);
  content.appendChild(el('div', 'sn-meta', meta));
  wrapper.appendChild(content);

  return wrapper;
}

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
  const hasProductLink = !!notification.productHref;

  const themeClass = settings.theme === 'modern' ? 'sn-modern-toast' : settings.theme === 'minimal' ? 'sn-minimal-toast' : '';
  const toast = el('div', `sn-toast ${settings.position} ${themeClass} sn-enter`.trim());

  let inner: HTMLElement;
  if (settings.theme === 'modern') {
    inner = buildModern(notification, title, meta, hasProductLink);
  } else if (settings.theme === 'minimal') {
    inner = buildMinimal(notification, meta);
  } else {
    inner = buildClassic(notification, title, meta, hasProductLink);
  }

  toast.appendChild(inner);

  const close = closeBtn();
  close.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    handle.cancelled = true;
    removeToast(toast);
  });
  toast.appendChild(close);

  toast.addEventListener('click', () => {
    trackEvent(merchantId, 'click', notification.id);
    if (notification.productHref) {
      try {
        const url = new URL(notification.productHref, window.location.href);
        if (url.protocol === 'https:' || url.protocol === 'http:') {
          window.open(url.toString(), '_self');
        }
      } catch {}
    }
  });

  root.appendChild(toast);
  handle.element = toast;

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
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      resolve();
    }, 500);
  });
}
