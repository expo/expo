import type { SymbolEffectOptions } from './symbolEffect';

export function flattenOptions(options?: SymbolEffectOptions) {
  if (!options) return undefined;
  const { speed } = options;
  const repeatField = options.repeat;
  if (repeatField === undefined) {
    return { speed };
  }
  if (repeatField === 'nonRepeating') {
    return { repeatKind: 'nonRepeating' as const, speed };
  }
  if (repeatField === 'continuous') {
    return { repeatKind: 'continuous' as const, speed };
  }
  return {
    repeatKind: 'periodic' as const,
    repeatCount: repeatField.count,
    repeatDelay: repeatField.delay,
    speed,
  };
}
