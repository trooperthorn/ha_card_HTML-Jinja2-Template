import { vi } from 'vitest';
import type { HomeAssistant } from '../src/types';
import type { RenderTemplateMessage } from '../src/ws-templates';

export interface FakeHass extends HomeAssistant {
  calls: Record<string, unknown>[];
  callbacks: ((message: RenderTemplateMessage) => void)[];
  unsub: ReturnType<typeof vi.fn<() => Promise<void>>>;
  reject: boolean;
}

export function fakeHass(options: { reject?: boolean; userName?: string } = {}): FakeHass {
  const hass: FakeHass = {
    calls: [],
    callbacks: [],
    unsub: vi.fn<() => Promise<void>>(async () => undefined),
    reject: options.reject ?? false,
    states: {},
    user: { name: options.userName ?? 'Sean' },
    connection: {
      subscribeMessage: <T>(callback: (message: T) => void, params: Record<string, unknown>) => {
        hass.calls.push(params);
        hass.callbacks.push(callback as (message: RenderTemplateMessage) => void);
        if (hass.reject) {
          return Promise.reject(new Error('template_error'));
        }
        return Promise.resolve(hass.unsub);
      },
    },
  };
  return hass;
}

export function push(hass: FakeHass, message: RenderTemplateMessage): void {
  hass.callbacks[hass.callbacks.length - 1](message);
}

export async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
