import { SharedObject } from 'expo';

import type { NativeSessionEvents } from '../../NativeLanguageModels.types';
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

export function nativeResult(
  text: string,
  usage: Record<string, number | null> = { inputTokens: null, outputTokens: null }
) {
  return JSON.stringify({ text, usage });
}

export class FakeSession extends SharedObject<NativeSessionEvents> {
  generateAsync = jest
    .fn<Promise<string>, [string, string, string]>()
    .mockResolvedValue(nativeResult('ready'));
  acceptResult = jest.fn<boolean, [string]>().mockReturnValue(true);
  discardResult = jest.fn<void, [string]>();
  cancel = jest.fn();
  dispose = jest.fn();
  release = jest.fn<void, []>(() => super.release());
  resolveTool = jest.fn().mockReturnValue(true);
  totalListenerCount() {
    return this.listenerCount('onText') + this.listenerCount('onToolCall');
  }
}
