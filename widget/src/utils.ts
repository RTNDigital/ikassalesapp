export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'az önce';
  if (diffMin < 60) return `${diffMin} dakika önce`;
  if (diffHour < 24) return `${diffHour} saat önce`;

  // Older than 24h: show a believable recent time based on string hash
  const hash = dateStr.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const fakeMin = (hash % 45) + 2;
  if (fakeMin < 60) return `${fakeMin} dakika önce`;
  return `${Math.floor(fakeMin / 60)} saat önce`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '');
}

export function isMobile(): boolean {
  return window.innerWidth < 768;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
