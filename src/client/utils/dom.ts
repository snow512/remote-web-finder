export const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;

export function esc(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replace(/"/g, '&quot;');
}
