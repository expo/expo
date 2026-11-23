import type { ObserveIntegrationsConfig } from '../types';

// A library that integrates itself with Observe declares its key on `expo-observe-interface`. These
// checks fail to compile if the key does not reach the `integrations` option of `configure`.

declare module 'expo-observe-interface' {
  interface ObserveIntegrationsConfig {
    'test-library'?: boolean | { level?: number };
  }
}

type Expect<T extends true> = T;
type Extends<A, B> = [A] extends [B] ? true : false;

export type _LibraryKeyIsAccepted = Expect<
  Extends<{ 'test-library': { level: 1 } }, ObserveIntegrationsConfig>
>;
export type _LibraryConfigIsTyped = Expect<
  Extends<ObserveIntegrationsConfig['test-library'], boolean | { level?: number } | undefined>
>;

describe('ObserveIntegrationsConfig', () => {
  it('type-checks', () => {});
});
