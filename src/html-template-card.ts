import { LitElement, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import * as pjson from '../package.json';
import { HomeAssistant, HtmlTemplateCardConfig, UnsubscribeFunc } from './types';
import {
  isRenderTemplateError,
  RenderTemplateMessage,
  RenderTemplateParams,
  subscribeRenderTemplate,
} from './ws-templates';
import { sanitizeHtml } from './sanitize';
import { insertLineBreaks } from './line-breaks';
import { applyTheme } from './theme';
import { registerCustomCard } from './register-custom-card';
import './editor';

const CARD_TYPE = 'html-template-card';
const DOCS_URL = 'https://github.com/trooperthorn/ha_card_HTML-Jinja2-Template#readme';
const GRID_CELL_HEIGHT = 56;
const GRID_GAP = 8;
const SUBSCRIPTION_KEYS: (keyof HtmlTemplateCardConfig)[] = [
  'content',
  'entities',
  'variables',
  'strict',
  'report_errors',
  'timeout',
  'do_not_parse',
];

interface GridOptions {
  columns: number;
  min_columns: number;
  min_rows: number;
  rows?: number;
}

let alwaysUpdateWarned = false;

export class HtmlTemplateCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ type: Boolean }) public preview = false;
  @state() private _config?: HtmlTemplateCardConfig;
  @state() private _rendered?: string;
  @state() private _error?: string;

  private _unsubRenderTemplate?: Promise<UnsubscribeFunc>;

  public static getConfigElement(): HTMLElement {
    return document.createElement(`${CARD_TYPE}-editor`);
  }

  public static getStubConfig(): Partial<HtmlTemplateCardConfig> {
    return { content: "Sun is {{ states('sun.sun') }}", entities: ['sun.sun'] };
  }

  public setConfig(config: HtmlTemplateCardConfig): void {
    if (!config || typeof config.content !== 'string') {
      throw new Error("You need to define 'content' in your configuration.");
    }
    if (config.always_update && !alwaysUpdateWarned) {
      alwaysUpdateWarned = true;
      console.warn(`${CARD_TYPE}: always_update is ignored; the server pushes every change the template depends on.`);
    }
    const previous = this._config;
    this._config = config;
    const subscriptionChanged =
      !previous || SUBSCRIPTION_KEYS.some((key) => JSON.stringify(previous[key]) !== JSON.stringify(config[key]));
    if (subscriptionChanged) {
      this._error = undefined;
      this._rendered = undefined;
      this._tryDisconnect().then(() => this._tryConnect());
    }
  }

  public getCardSize(): number {
    return Math.max(1, Math.ceil(this.offsetHeight / 50));
  }

  public getGridOptions(): GridOptions {
    const options: GridOptions = { columns: 12, min_columns: 3, min_rows: 1 };
    if (this.offsetHeight > 0) {
      options.rows = Math.max(1, Math.ceil((this.offsetHeight + GRID_GAP) / (GRID_CELL_HEIGHT + GRID_GAP)));
    }
    return options;
  }

  protected createRenderRoot(): HTMLElement | DocumentFragment {
    return this._config?.shadow ? super.createRenderRoot() : this;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._tryConnect();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._tryDisconnect();
  }

  protected willUpdate(changed: PropertyValues): void {
    if (changed.has('hass') && !this._unsubRenderTemplate) {
      this._tryConnect();
    }
    if (changed.has('hass') || changed.has('_config')) {
      applyTheme(this, this.hass, this._config?.theme);
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config) {
      return nothing;
    }
    let body: unknown = nothing;
    if (this._error) {
      body = html`<div class="html-template-card-error">${this._error}</div>`;
    } else if (this._rendered !== undefined) {
      body = unsafeHTML(this._prepareHtml(this._rendered));
    }
    if (this._config.picture_elements_mode || this._config.no_card) {
      return html`<div class="html-template-card-content">${body}</div>`;
    }
    const header = this._config.title
      ? html`<div class="card-header" style="padding: 8px 0 16px 0"><div class="name">${this._config.title}</div></div>`
      : nothing;
    return html`
      <ha-card style="padding: var(--html-template-card-padding, 16px)">
        ${header}
        <div class="html-template-card-content">${body}</div>
      </ha-card>
    `;
  }

  private _prepareHtml(content: string): string {
    const withBreaks = this._config?.line_breaks ? insertLineBreaks(content) : content;
    return this._config?.allow_unsafe_html ? withBreaks : sanitizeHtml(withBreaks);
  }

  private _subscriptionParams(): RenderTemplateParams {
    const config = this._config as HtmlTemplateCardConfig;
    const params: RenderTemplateParams = {
      template: config.content,
      entity_ids: config.entities,
      variables: { ...(config.variables ?? {}), config, user: this.hass?.user?.name },
      strict: config.strict !== false,
      report_errors: this.preview || config.report_errors === true,
    };
    if (typeof config.timeout === 'number') {
      params.timeout = config.timeout;
    }
    return params;
  }

  private _tryConnect(): void {
    if (this._unsubRenderTemplate || !this.hass || !this._config || !this.isConnected) {
      return;
    }
    if (this._config.do_not_parse) {
      this._rendered = this._config.content;
      return;
    }
    const raw = this._config.content;
    this._unsubRenderTemplate = subscribeRenderTemplate(
      this.hass.connection,
      (message: RenderTemplateMessage) => {
        if (isRenderTemplateError(message)) {
          this._error = message.error;
          return;
        }
        this._error = undefined;
        this._rendered = String(message.result);
      },
      this._subscriptionParams(),
    );
    this._unsubRenderTemplate.catch(() => {
      this._unsubRenderTemplate = undefined;
      this._error = undefined;
      this._rendered = raw;
    });
  }

  private async _tryDisconnect(): Promise<void> {
    const handle = this._unsubRenderTemplate;
    this._unsubRenderTemplate = undefined;
    if (!handle) {
      return;
    }
    try {
      const unsub = await handle;
      await unsub();
    } catch {
      return;
    }
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, HtmlTemplateCard);
}

registerCustomCard({
  type: CARD_TYPE,
  name: 'HTML Jinja2 Template card',
  description: 'Renders a Jinja2 template as HTML, updated live by the Home Assistant template engine.',
  documentationURL: DOCS_URL,
});

console.info(
  `%c HTML-TEMPLATE-CARD \n%c   Version ${pjson.version}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);
