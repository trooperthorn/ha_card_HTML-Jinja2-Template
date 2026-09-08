import { describe, expect, it } from 'vitest';
import '../src/editor';
import type { HtmlTemplateCardEditor } from '../src/editor';
import { fakeHass } from './helpers';

describe('editor', () => {
  it('renders an ha-form and emits config-changed with empty keys removed', async () => {
    const editor = document.createElement('html-template-card-editor') as HtmlTemplateCardEditor;
    editor.hass = fakeHass();
    editor.setConfig({ type: 'custom:html-template-card', content: 'x' });
    document.body.appendChild(editor);
    await editor.updateComplete;
    const form = editor.shadowRoot?.querySelector('ha-form');
    expect(form).not.toBeNull();
    let received: unknown;
    editor.addEventListener('config-changed', (event) => {
      received = (event as CustomEvent).detail.config;
    });
    form?.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: { type: 'custom:html-template-card', content: 'y', title: '', shadow: undefined } },
        bubbles: true,
        composed: true,
      }),
    );
    expect(received).toEqual({ type: 'custom:html-template-card', content: 'y' });
    editor.remove();
  });
});
