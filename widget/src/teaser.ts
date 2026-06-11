import { WidgetSettings } from './api';

export function renderTeaser(
  root: ShadowRoot,
  settings: WidgetSettings,
  onRestart: () => void,
): HTMLElement {
  const btn = document.createElement('button');
  btn.className = `sn-teaser ${settings.position}`;

  const dot = document.createElement('span');
  dot.className = 'sn-teaser-dot';
  btn.appendChild(dot);

  const text = document.createTextNode(settings.teaserText);
  btn.appendChild(text);

  btn.addEventListener('click', () => {
    if (btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
    onRestart();
  });

  root.appendChild(btn);
  return btn;
}
