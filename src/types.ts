export interface HtmlTemplateCardConfig {
  type: string;
  content: string;
  title?: string;
  entities?: string[];
  strict?: boolean;
  report_errors?: boolean;
  timeout?: number;
  variables?: Record<string, unknown>;
  do_not_parse?: boolean;
  ignore_line_breaks?: boolean;
  line_breaks?: boolean;
  always_update?: boolean;
  picture_elements_mode?: boolean;
  no_card?: boolean;
  allow_unsafe_html?: boolean;
  shadow?: boolean;
  theme?: string;
}

export type UnsubscribeFunc = () => Promise<void> | void;

export interface Connection {
  subscribeMessage<T>(callback: (message: T) => void, params: Record<string, unknown>): Promise<UnsubscribeFunc>;
}

export type ThemeVars = Record<string, string>;

export interface Theme {
  [name: string]: string | { light?: ThemeVars; dark?: ThemeVars } | undefined;
  modes?: { light?: ThemeVars; dark?: ThemeVars };
}

export interface HomeAssistant {
  connection: Connection;
  states: Record<string, unknown>;
  user?: { name?: string };
  themes?: { darkMode?: boolean; themes?: Record<string, Theme> };
}
