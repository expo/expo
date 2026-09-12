import type {
  NativeSession,
  NativeTextEvent,
  NativeToolEvent,
} from '../../NativeLanguageModels.types';
import type { ModelCapabilities } from '../../LanguageModels.types';

export function availableModel(overrides: Partial<ModelCapabilities> = {}) {
  return JSON.stringify({
    status: 'available',
    capabilities: {
      provider: 'apple-foundation-models',
      model: null,
      execution: 'on-device',
      constrainedOutput: 'supported',
      runtimeToolDeclarations: 'supported',
      images: 'unsupported',
      contextTokens: 4096,
      ...overrides,
    },
  });
}

type Event = NativeTextEvent | NativeToolEvent;
export class FakeSession implements NativeSession {
  listeners = new Map<string, Set<(event: never) => void>>();
  generateAsync = jest.fn<Promise<string>, [string, string, string]>().mockResolvedValue('ready');
  acceptResult = jest.fn<boolean, [string]>().mockReturnValue(true);
  discardResult = jest.fn<void, [string]>();
  cancel = jest.fn();
  dispose = jest.fn();
  release = jest.fn();
  resolveTool = jest.fn().mockReturnValue(true);
  addListener(event: string, callback: (event: never) => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(callback);
    this.listeners.set(event, listeners);
    return { remove: () => listeners.delete(callback) };
  }
  emit(event: string, value: Event) {
    this.listeners.get(event)?.forEach((listener) => listener(value as never));
  }
  get listenerCount() {
    return [...this.listeners.values()].reduce((count, values) => count + values.size, 0);
  }
}
