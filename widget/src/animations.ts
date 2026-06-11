export function getAnimationCSS(animation: string, position: string): string {
  const isLeft = position === 'bottom-left';
  const translateDir = isLeft ? '-120%' : '120%';

  if (animation === 'slide') {
    return `
      .sn-enter {
        transform: translateX(${translateDir});
        opacity: 0;
      }
      .sn-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      .sn-exit {
        transform: translateX(0);
        opacity: 1;
      }
      .sn-exit-active {
        transform: translateX(${translateDir});
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.5, 0, 0.75, 0), opacity 0.35s ease;
      }
    `;
  }

  if (animation === 'fade') {
    return `
      .sn-enter {
        opacity: 0;
        transform: translateY(16px);
      }
      .sn-enter-active {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .sn-exit {
        opacity: 1;
        transform: translateY(0);
      }
      .sn-exit-active {
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
    `;
  }

  // bounce
  return `
    .sn-enter {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
    }
    .sn-enter-active {
      opacity: 1;
      transform: scale(1) translateY(0);
      transition: opacity 0.4s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .sn-exit {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    .sn-exit-active {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
      transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.5, 0, 0.75, 0);
    }
  `;
}
