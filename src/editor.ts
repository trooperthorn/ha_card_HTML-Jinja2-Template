import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { HomeAssistant, HtmlTemplateCardConfig } from './types';

const SCHEMA = [
  { name: 'title', selector: { text: {} } },
  { name: 'content', required: true, selector: { template: {} } },
  { name: 'entities', selector: { entity: { multiple: true } } },
  {
    type: 'grid',
    name: '',
    schema: [
      { name: 'line_breaks', selector: { boolean: {} } },
      { name: 'ignore_line_breaks', selector: { boolean: {} } },
      { name: 'strict', selector: { boolean: {} } },
      { name: 'report_errors', selector: { boolean: {} } },
      { name: 'allow_unsafe_html', selector: { boolean: {} } },
      { name: 'shadow', selector: { boolean: {} } },
      { name: 'no_card', selector: { boolean: {} } },
    ],
  },
  { name: 'theme', selector: { theme: {} } },
];

const LABELS: Record<string, string> = {
  title: 'Title',
  content: 'Content (Jinja2 template rendering to HTML)',
  entities: 'Entities the template depends on',
  line_breaks: 'Insert <br> for newlines',
  ignore_line_breaks: 'Ignore line breaks (compatibility)',
  strict: 'Strict template rendering',
  report_errors: 'Report template errors in the card',
  allow_unsafe_html: 'Allow unsafe HTML (disable sanitiser)',
  shadow: 'Render in shadow DOM',
  no_card: 'No card frame (picture-elements mode)',
  theme: 'Theme',
};

export class HtmlTemplateCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private _config?: HtmlTemplateCardConfig;

  public setConfig(config: HtmlTemplateCardConfig): void {
    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _computeLabel = (schema: { name: string }): string => LABELS[schema.name] ?? schema.name;

  private _valueChanged(event: CustomEvent): void {
    event.stopPropagation();
    const config = { ...(event.detail.value as HtmlTemplateCardConfig) };
    for (const key of Object.keys(config) as (keyof HtmlTemplateCardConfig)[]) {
      if (config[key] === undefined || config[key] === '') {
        delete config[key];
      }
    }
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('html-template-card-editor')) {
  customElements.define('html-template-card-editor', HtmlTemplateCardEditor);
}
