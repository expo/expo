'use client';

import { isValidElement, useMemo, type ReactElement } from 'react';

import { useCompositionOption } from './CompositionOptionsContext';
import type { NativeStackNavigationOptions } from '../../../react-navigation/native-stack';

/**
 * Variant of `useCompositionOption` that absorbs the memoization burden by
 * structurally fingerprinting `input`. Use this when the caller's options
 * derive from data that may contain unstable references across renders:
 * JSX children (a fresh array on every parent render), inline style
 * objects, inline color values, inline event handlers, etc.
 *
 * The fingerprint walks `input` recursively and skips function values, so
 * inline `onPress`/`onChangeText` callbacks do not retrigger registration.
 * Function values still flow through the BUILT options object via the
 * `build` callback, so the rendered output uses the closure that was
 * active at the time of the last meaningful change. Handlers that need
 * to read live state should close over a ref, or be stabilized with
 * `useCallback` so the helper sees a single identity.
 *
 * The build callback runs only when the fingerprint changes, so callers
 * do not need their own `useMemo`.
 *
 * @example
 * ```tsx
 * useStableCompositionOption(
 *   { children, placement, asChild },
 *   (input) => appendStackToolbarPropsToOptions({}, input)
 * );
 * ```
 */
export function useStableCompositionOption<TInput>(
  input: TInput,
  build: (input: TInput) => Partial<NativeStackNavigationOptions>
): void {
  const fingerprint = fingerprintValue(input);
  // `fingerprint` captures `input` structurally; exhaustive-deps can't see it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => build(input), [fingerprint]);
  useCompositionOption(options);
}

/**
 * Maximum recursion depth for the fingerprint walker. React composition
 * trees rarely exceed 6 levels; 10 leaves headroom and bounds runtime.
 *
 * @internal
 */
const MAX_FINGERPRINT_DEPTH = 10;

/**
 * Produces a stable structural string for any value. Two inputs that
 * produce the same string can be safely treated as equivalent for the
 * purposes of `useCompositionOption` registration. Function-typed values
 * are intentionally skipped — see `useStableCompositionOption` for the
 * rationale.
 *
 * @internal
 */
export function fingerprintValue(value: unknown, depth = 0): string {
  if (depth > MAX_FINGERPRINT_DEPTH) return '~';
  if (value === null) return 'null';
  if (value === undefined) return 'undef';
  const t = typeof value;
  if (t === 'function') return 'fn';
  if (t === 'string') return `s:${value as string}`;
  if (t === 'number') return `n:${value as number}`;
  if (t === 'boolean') return `b:${value as boolean}`;
  if (t === 'bigint') return `bi:${value as bigint}`;
  if (t === 'symbol') return `sy:${(value as symbol).toString()}`;
  if (t !== 'object') return '?';
  if (isValidElement(value)) return fingerprintElement(value, depth + 1);
  if (Array.isArray(value)) {
    return `[${value.map((v) => fingerprintValue(v, depth + 1)).join(',')}]`;
  }
  // React refs from `useRef()` look like `{ current: T }` on `Object.prototype`.
  // Walking them is unsafe because `current` can hold a DOM node, a class
  // instance, or a circular structure. Skip them.
  if (isLikelyRefObject(value)) return 'ref';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const bits: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'function' || v === undefined) continue;
    bits.push(`${k}:${fingerprintValue(v, depth + 1)}`);
  }
  return `{${bits.join(',')}}`;
}

function fingerprintElement(node: ReactElement, depth: number): string {
  const { type, key } = node;
  const named = type as { displayName?: string; name?: string };
  const name = typeof type === 'string' ? type : (named.displayName ?? named.name ?? '?');
  const props = (node.props ?? {}) as Record<string, unknown>;
  const keys = Object.keys(props).sort();
  const bits: string[] = [];
  for (const k of keys) {
    const v = props[k];
    if (typeof v === 'function' || v === undefined) continue;
    bits.push(`${k}:${fingerprintValue(v, depth + 1)}`);
  }
  return `e:${name}#${key ?? ''}{${bits.join(',')}}`;
}

function isLikelyRefObject(value: object): boolean {
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === 'current';
}
