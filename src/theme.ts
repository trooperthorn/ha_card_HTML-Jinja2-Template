import { HomeAssistant, ThemeVars } from './types';

const applied = new WeakMap<HTMLElement, string[]>();

export function applyTheme(element: HTMLElement, hass: HomeAssistant | undefined, theme: string | undefined): void {
  for (const key of applied.get(element) ?? []) {
    element.style.removeProperty(key);
  }
  applied.delete(element);
  if (!theme || theme === 'default' || !hass?.themes?.themes?.[theme]) {
    return;
  }
  const { modes, ...base } = hass.themes.themes[theme];
  const mode = modes?.[hass.themes.darkMode ? 'dark' : 'light'] ?? {};
  const vars: ThemeVars = { ...(base as ThemeVars), ...mode };
  const keys: string[] = [];
  for (const [name, value] of Object.entries(vars)) {
    const property = `--${name}`;
    element.style.setProperty(property, String(value));
    keys.push(property);
  }
  applied.set(element, keys);
}
