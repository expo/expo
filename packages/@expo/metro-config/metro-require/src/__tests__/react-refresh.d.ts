// Minimal types for the untyped `react-refresh/runtime` module. There is no
// published `@types/react-refresh`, so we declare just the runtime surface used
// by the Metro Fast Refresh test harness.
declare module 'react-refresh/runtime' {
  export function injectIntoGlobalHook(global: unknown): void;
  export function createSignatureFunctionForTransform(): (...args: any[]) => any;
  export function isLikelyComponentType(type: unknown): boolean;
  export function getFamilyByType(type: unknown): unknown;
  export function register(type: unknown, id: string): void;
  export function hasUnrecoverableErrors(): boolean;
  export function performReactRefresh(): void;
}
