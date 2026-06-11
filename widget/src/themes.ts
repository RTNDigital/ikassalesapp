interface ThemeColors {
  background?: string;
  text?: string;
  border?: string;
}

export function getThemeCSS(theme: string, colors: ThemeColors): string {
  const bg = colors.background || '#ffffff';
  const text = colors.text || '#1f2937';
  const border = colors.border || '#e5e7eb';

  return `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .sn-toast {
      position: fixed;
      z-index: 999999;
      max-width: 340px;
      width: calc(100vw - 32px);
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bg};
      color: ${text};
      border: 1px solid ${border};
      cursor: pointer;
      overflow: hidden;
      line-height: 1.4;
      font-size: 14px;
    }
    .sn-toast.bottom-left { bottom: 20px; left: 20px; }
    .sn-toast.bottom-right { bottom: 20px; right: 20px; }

    .sn-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      line-height: 20px;
      text-align: center;
      color: #9ca3af;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: color 0.15s, background 0.15s;
      z-index: 1;
    }
    .sn-close:hover { color: #374151; background: rgba(0,0,0,0.05); }

    /* --- Shared layout: image left, content right --- */
    .sn-inner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 30px 14px 14px;
    }

    .sn-img-wrap {
      flex-shrink: 0;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      background: #f3f4f6;
      border: 2px solid ${border};
    }
    .sn-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .sn-content {
      flex: 1;
      min-width: 0;
    }

    .sn-title {
      font-size: 13px;
      color: ${text};
      margin-bottom: 6px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sn-title strong { font-weight: 700; }

    .sn-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .sn-meta {
      font-size: 11px;
      color: #9ca3af;
    }

    .sn-cta {
      font-size: 11px;
      font-weight: 600;
      color: #ffffff;
      background: #3b82f6;
      padding: 3px 10px;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* --- Modern: slightly different text style --- */
    .sn-modern .sn-title {
      font-size: 13px;
    }
    .sn-modern .sn-img-wrap {
      width: 60px;
      height: 60px;
      border-radius: 8px;
    }

    /* --- Minimal: no image, dot indicator --- */
    .sn-minimal-inner {
      gap: 10px;
    }
    .sn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .sn-minimal-inner .sn-content { flex: 1; }

    /* --- Teaser button --- */
    .sn-teaser {
      position: fixed;
      z-index: 999999;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      background: ${bg};
      color: ${text};
      border: 1px solid ${border};
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: box-shadow 0.15s;
      white-space: nowrap;
    }
    .sn-teaser:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .sn-teaser.bottom-left { bottom: 20px; left: 20px; }
    .sn-teaser.bottom-right { bottom: 20px; right: 20px; }
    .sn-teaser-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

    /* --- Mobile --- */
    @media (max-width: 480px) {
      .sn-toast {
        max-width: calc(100vw - 24px);
        left: 12px !important;
        right: 12px !important;
        bottom: 12px !important;
      }
    }
  `;
}
