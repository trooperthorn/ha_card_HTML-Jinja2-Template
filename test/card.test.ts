import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../src/html-template-card';
import type { HtmlTemplateCard } from '../src/html-template-card';
import type { HtmlTemplateCardConfig } from '../src/types';
import { fakeHass, push, settle, FakeHass } from './helpers';

function makeCard(config: Partial<HtmlTemplateCardConfig>, hass: FakeHass): HtmlTemplateCard {
  const card = document.createElement('html-template-card') as HtmlTemplateCard;
  card.setConfig({ type: 'custom:html-template-card', content: 'x', ...config } as HtmlTemplateCardConfig);
  card.hass = hass;
  return card;
}

let hass: FakeHass;

beforeEach(() => {
  hass = fakeHass();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('subscription lifecycle', () => {
  it('subscribes exactly once per connect with the full parameter set', async () => {
    const card = makeCard({ content: "{{ states('sun.sun') }}", entities: ['sun.sun'], timeout: 5 }, hass);
    document.body.appendChild(card);
    await card.updateComplete;
    await settle();
    expect(hass.calls).toHaveLength(1);
    const params = hass.calls[0];
    expect(params.type).toBe('render_template');
    expect(params.template).toBe("{{ states('sun.sun') }}");
    expect(params.entity_ids).toEqual(['sun.sun']);
    expect(params.strict).toBe(true);
    expect(params.report_errors).toBe(false);
    expect(params.timeout).toBe(5);
    const variables = params.variables as Record<string, unknown>;
    expect(variables.user).toBe('Sean');
    expect((variables.config as HtmlTemplateCardConfig).content).toBe("{{ states('sun.sun') }}");
  });

  it('honours strict: false and report_errors: true, and forces report_errors in preview', async () => {
    const card = makeCard({ strict: false, report_errors: true }, hass);
    document.body.appendChild(card);
    await settle();
    expect(hass.calls[0].strict).toBe(false);
    expect(hass.calls[0].report_errors).toBe(true);

    const previewHass = fakeHass();
    const previewCard = makeCard({ content: 'y' }, previewHass);
    previewCard.preview = true;
    document.body.appendChild(previewCard);
    await settle();
    expect(previewHass.calls[0].report_errors).toBe(true);
  });

  it('merges config variables under the reserved config and user keys', async () => {
    const card = makeCard({ variables: { greeting: 'hi' } }, hass);
    document.body.appendChild(card);
    await settle();
    const variables = hass.calls[0].variables as Record<string, unknown>;
    expect(variables.greeting).toBe('hi');
    expect(variables.user).toBe('Sean');
    expect(variables.config).toBeDefined();
  });

  it('unsubscribes on disconnect and does not double-subscribe on reconnect', async () => {
    const card = makeCard({}, hass);
    document.body.appendChild(card);
    await settle();
    expect(hass.calls).toHaveLength(1);
    card.remove();
    await settle();
    expect(hass.unsub).toHaveBeenCalledTimes(1);
    document.body.appendChild(card);
    await settle();
    expect(hass.calls).toHaveLength(2);
    expect(hass.unsub).toHaveBeenCalledTimes(1);
  });

  it('resubscribes when content changes and not when an unrelated key changes', async () => {
    const card = makeCard({ content: 'a', title: 'one' }, hass);
    document.body.appendChild(card);
    await settle();
    expect(hass.calls).toHaveLength(1);
    card.setConfig({ type: 'custom:html-template-card', content: 'a', title: 'two' });
    await settle();
    expect(hass.calls).toHaveLength(1);
    expect(hass.unsub).not.toHaveBeenCalled();
    card.setConfig({ type: 'custom:html-template-card', content: 'b', title: 'two' });
    await settle();
    expect(hass.unsub).toHaveBeenCalledTimes(1);
    expect(hass.calls).toHaveLength(2);
    expect(hass.calls[1].template).toBe('b');
  });

  it('does not resubscribe when hass is replaced', async () => {
    const card = makeCard({}, hass);
    document.body.appendChild(card);
    await settle();
    for (let i = 0; i < 20; i += 1) {
      card.hass = { ...hass, states: { [`sensor.n${i}`]: { state: String(i) } } } as FakeHass;
      await card.updateComplete;
    }
    await settle();
    expect(hass.calls).toHaveLength(1);
  });

  it('renders the result, then renders an error event in the error div', async () => {
    const card = makeCard({}, hass);
    document.body.appendChild(card);
    await settle();
    push(hass, { result: '<b>hello</b>', listeners: { all: false, domains: [], entities: [], time: false } });
    await card.updateComplete;
    expect(card.querySelector('.html-template-card-content b')?.textContent).toBe('hello');
    push(hass, { error: "UndefinedError: 'nope' is undefined", level: 'ERROR' });
    await card.updateComplete;
    const error = card.querySelector('.html-template-card-error');
    expect(error?.textContent).toContain('UndefinedError');
    expect(card.querySelector('.html-template-card-content b')).toBeNull();
  });

  it('renders the raw content and clears the handle when the subscription is rejected', async () => {
    const rejecting = fakeHass({ reject: true });
    const card = makeCard({ content: 'raw {{ text }}' }, rejecting);
    document.body.appendChild(card);
    await settle();
    await card.updateComplete;
    expect(card.querySelector('.html-template-card-content')?.textContent).toContain('raw {{ text }}');
    card.remove();
    await settle();
    document.body.appendChild(card);
    await settle();
    expect(rejecting.calls).toHaveLength(2);
  });

  it('does not throw when a referenced entity is missing from hass.states', async () => {
    const card = makeCard({ content: "{{ states('sensor.missing') }}", entities: ['sensor.missing'] }, hass);
    expect(() => document.body.appendChild(card)).not.toThrow();
    await settle();
    card.hass = { ...hass, states: {} } as FakeHass;
    await expect(card.updateComplete).resolves.toBeDefined();
  });

  it('never subscribes with do_not_parse and renders the content verbatim', async () => {
    const card = makeCard({ content: '<i>{{ not parsed }}</i>', do_not_parse: true }, hass);
    document.body.appendChild(card);
    await settle();
    await card.updateComplete;
    expect(hass.calls).toHaveLength(0);
    expect(card.querySelector('i')?.textContent).toBe('{{ not parsed }}');
  });

  it('warns once about always_update', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    makeCard({ always_update: true }, hass);
    makeCard({ always_update: true }, hass);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('always_update');
    warn.mockRestore();
  });

  it('rejects a config without content', () => {
    const card = document.createElement('html-template-card') as HtmlTemplateCard;
    expect(() => card.setConfig({ type: 'custom:html-template-card' } as HtmlTemplateCardConfig)).toThrow(/content/);
  });
});

describe('rendering', () => {
  it('inserts the title as text, not HTML, inside a card-header', async () => {
    const card = makeCard({ title: '<img src=x onerror=alert(1)>' }, hass);
    document.body.appendChild(card);
    await card.updateComplete;
    const header = card.querySelector('.card-header .name');
    expect(header?.textContent).toBe('<img src=x onerror=alert(1)>');
    expect(header?.querySelector('img')).toBeNull();
    expect(card.querySelector('ha-card')?.getAttribute('style')).toContain('--html-template-card-padding');
  });

  it('renders a bare div for no_card and picture_elements_mode', async () => {
    for (const key of ['no_card', 'picture_elements_mode'] as const) {
      const card = makeCard({ [key]: true }, fakeHass());
      document.body.appendChild(card);
      await card.updateComplete;
      expect(card.querySelector('ha-card')).toBeNull();
      expect(card.querySelector('div.html-template-card-content')).not.toBeNull();
    }
  });

  it('inserts <br> for newlines only when line_breaks is true', async () => {
    const card = makeCard({ line_breaks: true }, hass);
    document.body.appendChild(card);
    await settle();
    push(hass, { result: 'one\ntwo' });
    await card.updateComplete;
    expect(card.querySelectorAll('br')).toHaveLength(1);

    const plainHass = fakeHass();
    const plain = makeCard({ content: 'z' }, plainHass);
    document.body.appendChild(plain);
    await settle();
    push(plainHass, { result: 'one\ntwo' });
    await plain.updateComplete;
    expect(plain.querySelectorAll('br')).toHaveLength(0);
  });

  it('sanitises the rendered result unless allow_unsafe_html is set', async () => {
    const card = makeCard({}, hass);
    document.body.appendChild(card);
    await settle();
    push(hass, { result: '<img src=x onerror="alert(1)"><b>ok</b>' });
    await card.updateComplete;
    expect(card.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(card.querySelector('b')?.textContent).toBe('ok');

    const unsafeHass = fakeHass();
    const unsafe = makeCard({ content: 'u', allow_unsafe_html: true }, unsafeHass);
    document.body.appendChild(unsafe);
    await settle();
    push(unsafeHass, { result: '<span data-x="1" onclick="void 0">ok</span>' });
    await unsafe.updateComplete;
    expect(unsafe.querySelector('span')?.getAttribute('onclick')).toBe('void 0');
  });

  it('renders into a shadow root only when shadow is true', async () => {
    const light = makeCard({}, hass);
    document.body.appendChild(light);
    await light.updateComplete;
    expect(light.shadowRoot).toBeNull();

    const shadow = makeCard({ content: 's', shadow: true }, fakeHass());
    document.body.appendChild(shadow);
    await shadow.updateComplete;
    expect(shadow.shadowRoot).not.toBeNull();
    expect(shadow.shadowRoot?.querySelector('ha-card')).not.toBeNull();
  });

  it('applies and removes theme variables from hass.themes', async () => {
    const themed = {
      ...hass,
      themes: {
        darkMode: true,
        themes: { led: { 'primary-color': 'red', modes: { dark: { 'card-background-color': 'black' } } } },
      },
    };
    const card = makeCard({ theme: 'led' }, themed as FakeHass);
    document.body.appendChild(card);
    await card.updateComplete;
    expect(card.style.getPropertyValue('--primary-color')).toBe('red');
    expect(card.style.getPropertyValue('--card-background-color')).toBe('black');
    card.setConfig({ type: 'custom:html-template-card', content: 'x' });
    await card.updateComplete;
    expect(card.style.getPropertyValue('--primary-color')).toBe('');
  });
});

describe('sizing and registration', () => {
  it('reports grid options with a 12 column span and derives rows from height', () => {
    const card = makeCard({}, hass);
    expect(card.getGridOptions()).toEqual({ columns: 12, min_columns: 3, min_rows: 1 });
    Object.defineProperty(card, 'offsetHeight', { value: 200, configurable: true });
    expect(card.getGridOptions()).toEqual({ columns: 12, min_columns: 3, min_rows: 1, rows: 4 });
    expect(card.getCardSize()).toBe(4);
  });

  it('getCardSize is at least 1', () => {
    const card = makeCard({}, hass);
    expect(card.getCardSize()).toBe(1);
  });

  it('registers window.customCards exactly once and provides a stub config', async () => {
    await import('../src/html-template-card');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entries = (window as any).customCards.filter((c: { type: string }) => c.type === 'html-template-card');
    expect(entries).toHaveLength(1);
    expect(entries[0].documentationURL).toContain('trooperthorn/ha_card_HTML-Jinja2-Template');
    const ctor = customElements.get('html-template-card') as typeof HtmlTemplateCard;
    expect(ctor.getStubConfig()).toEqual({ content: "Sun is {{ states('sun.sun') }}", entities: ['sun.sun'] });
    expect(ctor.getConfigElement().tagName.toLowerCase()).toBe('html-template-card-editor');
  });
});
