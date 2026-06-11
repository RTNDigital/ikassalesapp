interface ThemeColors {
  background?: string;
  text?: string;
  border?: string;
}

export function getThemeCSS(theme: string, colors: ThemeColors): string {
  const bg = colors.background || '#ffffff';
  const text = colors.text || '#1f2937';
  const border = colors.border || '#e5e7eb';

  const base = `
    :host {
      all: initial;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    .sn-toast {
      position: fixed;
      z-index: 999999;
      max-width: 350px;
      width: calc(100vw - 32px);
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${bg};
      color: ${text};
      border: 1px solid ${border};
      cursor: pointer;
      overflow: hidden;
      line-height: 1.4;
      font-size: 14px;
    }
    .sn-toast.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .sn-toast.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .sn-close {
      position: absolute;
      top: 6px;
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
    .sn-close:hover {
      color: #374151;
      background: rgba(0,0,0,0.05);
    }
    .sn-teaser {
      position: fixed;
      z-index: 999999;
      padding: 8px 16px;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
    .sn-teaser:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    .sn-teaser.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .sn-teaser.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .sn-teaser-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }
    @media (max-width: 480px) {
      .sn-toast {
        max-width: calc(100vw - 24px);
        left: 12px !important;
        right: 12px !important;
        bottom: 12px !important;
      }
      .sn-teaser {
        left: 12px !important;
        right: auto !important;
        bottom: 12px !important;
      }
    }
  `;

  let themeStyles = '';

  if (theme === 'classic') {
    themeStyles = `
      .sn-classic {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 32px 12px 12px;
      }
      .sn-classic-img {
        width: 56px;
        height: 56px;
        border-radius: 6px;
        object-fit: cover;
        flex-shrink: 0;
        background: #f3f4f6;
      }
      .sn-classic-content {
        flex: 1;
        min-width: 0;
      }
      .sn-classic-title {
        font-size: 13px;
        color: ${text};
        margin-bottom: 2px;
      }
      .sn-classic-product {
        font-size: 14px;
        font-weight: 600;
        color: ${text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }
      .sn-classic-meta {
        font-size: 12px;
        color: #6b7280;
      }
    `;
  } else if (theme === 'modern') {
    themeStyles = `
      .sn-modern {
        padding: 0;
      }
      .sn-modern-header {
        padding: 10px 32px 8px 12px;
        font-size: 13px;
        color: ${text};
      }
      .sn-modern-img {
        width: 100%;
        height: 140px;
        object-fit: cover;
        display: block;
        background: #f3f4f6;
      }
      .sn-modern-footer {
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .sn-modern-product {
        font-size: 14px;
        font-weight: 600;
        color: ${text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
      }
      .sn-modern-meta {
        font-size: 12px;
        color: #6b7280;
        white-space: nowrap;
        flex-shrink: 0;
      }
    `;
  } else if (theme === 'minimal') {
    themeStyles = `
      .sn-minimal {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 32px 12px 14px;
      }
      .sn-minimal-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        flex-shrink: 0;
      }
      .sn-minimal-text {
        font-size: 14px;
        color: ${text};
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .sn-minimal-text strong {
        font-weight: 600;
      }
    `;
  }

  return base + themeStyles;
}
