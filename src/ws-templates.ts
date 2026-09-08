import { Connection, UnsubscribeFunc } from './types';

export interface RenderTemplateParams {
  template: string;
  entity_ids?: string[];
  variables?: Record<string, unknown>;
  timeout?: number;
  strict?: boolean;
  report_errors?: boolean;
}

export interface RenderTemplateResult {
  result: string;
  listeners?: { all: boolean; domains: string[]; entities: string[]; time: boolean };
}

export interface RenderTemplateError {
  error: string;
  level: 'ERROR' | 'WARNING';
}

export type RenderTemplateMessage = RenderTemplateResult | RenderTemplateError;

export function isRenderTemplateError(message: RenderTemplateMessage): message is RenderTemplateError {
  return 'error' in message;
}

export function subscribeRenderTemplate(
  connection: Connection,
  onChange: (message: RenderTemplateMessage) => void,
  params: RenderTemplateParams,
): Promise<UnsubscribeFunc> {
  return connection.subscribeMessage<RenderTemplateMessage>(onChange, { type: 'render_template', ...params });
}
