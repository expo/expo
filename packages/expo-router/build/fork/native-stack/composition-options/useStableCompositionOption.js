"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStableCompositionOption = useStableCompositionOption;
exports.fingerprintValue = fingerprintValue;
const react_1 = require("react");
const CompositionOptionsContext_1 = require("./CompositionOptionsContext");
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
function useStableCompositionOption(input, build) {
    const fingerprint = fingerprintValue(input);
    // `fingerprint` captures `input` structurally; exhaustive-deps can't see it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const options = (0, react_1.useMemo)(() => build(input), [fingerprint]);
    (0, CompositionOptionsContext_1.useCompositionOption)(options);
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
function fingerprintValue(value, depth = 0) {
    if (depth > MAX_FINGERPRINT_DEPTH)
        return '~';
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undef';
    const t = typeof value;
    if (t === 'function')
        return 'fn';
    if (t === 'string')
        return `s:${value}`;
    if (t === 'number')
        return `n:${value}`;
    if (t === 'boolean')
        return `b:${value}`;
    if (t === 'bigint')
        return `bi:${value}`;
    if (t === 'symbol')
        return `sy:${value.toString()}`;
    if (t !== 'object')
        return '?';
    if ((0, react_1.isValidElement)(value))
        return fingerprintElement(value, depth + 1);
    if (Array.isArray(value)) {
        return `[${value.map((v) => fingerprintValue(v, depth + 1)).join(',')}]`;
    }
    // React refs from `useRef()` look like `{ current: T }` on `Object.prototype`.
    // Walking them is unsafe because `current` can hold a DOM node, a class
    // instance, or a circular structure. Skip them.
    if (isLikelyRefObject(value))
        return 'ref';
    const obj = value;
    const keys = Object.keys(obj).sort();
    const bits = [];
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'function' || v === undefined)
            continue;
        bits.push(`${k}:${fingerprintValue(v, depth + 1)}`);
    }
    return `{${bits.join(',')}}`;
}
function fingerprintElement(node, depth) {
    const { type, key } = node;
    const named = type;
    const name = typeof type === 'string' ? type : (named.displayName ?? named.name ?? '?');
    const props = (node.props ?? {});
    const keys = Object.keys(props).sort();
    const bits = [];
    for (const k of keys) {
        const v = props[k];
        if (typeof v === 'function' || v === undefined)
            continue;
        bits.push(`${k}:${fingerprintValue(v, depth + 1)}`);
    }
    return `e:${name}#${key ?? ''}{${bits.join(',')}}`;
}
function isLikelyRefObject(value) {
    if (Object.getPrototypeOf(value) !== Object.prototype)
        return false;
    const keys = Object.keys(value);
    return keys.length === 1 && keys[0] === 'current';
}
//# sourceMappingURL=useStableCompositionOption.js.map