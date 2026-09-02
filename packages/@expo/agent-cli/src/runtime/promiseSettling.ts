// @ref llp/0005-runtime-loop-tools.rfc.md §runtime:eval — Runtime eval.
// Settling a promise that the Chrome DevTools Protocol cannot settle.
//
// `Runtime.evaluate` takes an `awaitPromise` flag, and it is inert in React Native. CDP only awaits
// a result the runtime tagged `subtype: "promise"`, and React Native replaces the engine's `Promise`
// with a JavaScript polyfill from `@react-native/js-polyfills`, which is an ordinary object as far
// as the inspector is concerned [observed — SDK 57 / RN 0.86.2 in Expo Go on iOS, 2026-08-23]:
//
//     Runtime.evaluate("Promise.resolve(42)", { returnByValue: false })
//       -> { result: { type: "object", className: "Object", objectId: "1" } }   // no subtype
//     Runtime.evaluate("Promise.resolve(42)", { returnByValue: true, awaitPromise: true })
//       -> { result: { type: "object", value: { _A: null, _x: 0, _y: 1, _z: 42 } } }
//
// `{_A,_x,_y,_z}` is the polyfill's internal state, which is what every `fetch`, AsyncStorage read
// and store selector used to come back as. Nothing in CDP can fix this from the outside, so the
// settling is done inside the app: the expression is wrapped so the app itself detects a thenable,
// subscribes to it, and parks the outcome on a global under a nonce, and the CLI reads that global
// back with a short poll.
//
// Two properties this is built around:
//
//   - **A non-thenable is untouched.** The wrapper returns the value itself, so the runtime
//     serializes it exactly as it did before and `result.type` is still the runtime's own answer.
//     Only a thenable takes the second path.
//   - **The marker cannot be forged by a value.** "The expression returned a promise" is signalled
//     by an object carrying one key that holds the nonce of this run, so a value that happens to
//     look like a report is not mistaken for one.

import { randomBytes } from 'crypto';

/** The prefix of the key the wrapper marks a pending promise with. */
const PENDING_MARKER_PREFIX = '__agentCliPendingPromise_';

/** A run's nonce: what ties a marker and a parked outcome to this evaluation and no other. */
export function createPromiseNonce(): string {
  return randomBytes(8).toString('hex');
}

/** The key the wrapper marks a pending promise with, for this run only. */
export function pendingMarkerKey(nonce: string): string {
  return `${PENDING_MARKER_PREFIX}${nonce}__`;
}

/**
 * Whether a returned value is this run's "the expression returned a promise" marker.
 *
 * Both the key and the value have to match the nonce, so a caller evaluating an object that copied
 * the key from an earlier report still reads as a plain value.
 */
export function isPendingPromiseMarker(value: unknown, nonce: string): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>)[pendingMarkerKey(nonce)] === nonce
  );
}

/** What the app parked for a promise that settled, as the poll expression reports it. */
export type SettledPromiseSlot =
  | {
      state: 'fulfilled';
      /** `typeof` of the settled value, computed in the app: CDP never sees the value alone. */
      type: string;
      /** The settled value, absent when the runtime could not serialize it. */
      value?: unknown;
      /** `String(value)` for a value that does not survive serialization, e.g. a function. */
      description?: string;
    }
  | { state: 'rejected'; reason: { text: string; stack: string | null } }
  /** The promise has not settled yet. */
  | { state: 'pending' }
  /**
   * No slot under this nonce.
   *
   * Only reachable when the app reloaded between the two evaluations, which wipes the globals: the
   * outcome is gone and the wait cannot be resumed, so it is its own answer rather than "pending".
   */
  | { state: 'missing' };

/** Read what a poll came back with, or null when the answer is not one of this module's. */
export function parseSettledPromiseSlot(value: unknown): SettledPromiseSlot | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }
  const slot = value as Record<string, unknown>;
  switch (slot.state) {
    case 'pending':
    case 'missing':
      return { state: slot.state };
    case 'fulfilled':
      return {
        state: 'fulfilled',
        type: typeof slot.type === 'string' ? slot.type : 'undefined',
        ...('value' in slot ? { value: slot.value } : {}),
        ...(typeof slot.description === 'string' ? { description: slot.description } : {}),
      };
    case 'rejected': {
      const reason = (slot.reason ?? {}) as Record<string, unknown>;
      return {
        state: 'rejected',
        reason: {
          text: typeof reason.text === 'string' ? reason.text : 'The app reported no reason.',
          stack: typeof reason.stack === 'string' ? reason.stack : null,
        },
      };
    }
    default:
      return null;
  }
}

/** Where the parked outcomes live in the app. One object, so one `delete` cleans a run up. */
const SLOTS_GLOBAL = '__agentCliPromiseSlots';

/**
 * Wrap an expression so the app answers "here is the value" or "this is a promise, I am watching
 * it", in one round trip.
 *
 * The expression is evaluated inside a function rather than at the top level, which is the one
 * behaviour this changes: a *statement* (`var x = 1`) is a syntax error where it used to run. The
 * caller detects that answer and re-evaluates the expression as it was written — see
 * `looksLikeWrapperSyntaxError`.
 *
 * @param expression the caller's expression, inlined verbatim.
 * @param nonce this run's nonce.
 * @param options.subscribe register a callback for the settled value. False for
 * `--no-await-promise`, which reports that a promise came back and parks nothing in the app.
 */
export function wrapExpressionForPromises(
  expression: string,
  nonce: string,
  { subscribe = true }: { subscribe?: boolean } = {}
): string {
  const marker = JSON.stringify(pendingMarkerKey(nonce));
  const key = JSON.stringify(nonce);

  // `typeof globalThis !== 'undefined'` rather than a bare `globalThis`: React Native has shipped
  // runtimes without it, and a ReferenceError here would read as a failure of the caller's code.
  const subscription = subscribe
    ? `
  var __agentCliGlobal = typeof globalThis !== 'undefined' ? globalThis : this;
  var __agentCliSlots = __agentCliGlobal.${SLOTS_GLOBAL} || (__agentCliGlobal.${SLOTS_GLOBAL} = {});
  var __agentCliSlot = { state: 'pending' };
  __agentCliSlots[${key}] = __agentCliSlot;
  var __agentCliDescribe = function (__agentCliReason) {
    try {
      if (__agentCliReason instanceof Error) {
        return {
          text: String(__agentCliReason),
          stack: __agentCliReason.stack == null ? null : String(__agentCliReason.stack),
        };
      }
      if (typeof __agentCliReason === 'string') {
        return { text: __agentCliReason, stack: null };
      }
      var __agentCliJson;
      try {
        __agentCliJson = JSON.stringify(__agentCliReason);
      } catch (__agentCliError) {}
      return {
        text: __agentCliJson === undefined ? String(__agentCliReason) : __agentCliJson,
        stack: null,
      };
    } catch (__agentCliError) {
      return { text: 'The rejection reason could not be described.', stack: null };
    }
  };
  try {
    __agentCliValue.then(
      function (__agentCliSettled) {
        __agentCliSlot.state = 'fulfilled';
        __agentCliSlot.type = typeof __agentCliSettled;
        __agentCliSlot.value = __agentCliSettled;
      },
      function (__agentCliReason) {
        __agentCliSlot.state = 'rejected';
        __agentCliSlot.reason = __agentCliDescribe(__agentCliReason);
      }
    );
  } catch (__agentCliError) {
    __agentCliSlot.state = 'rejected';
    __agentCliSlot.reason = __agentCliDescribe(__agentCliError);
  }`
    : '';

  return `(function () {
  var __agentCliValue = (${expression});
  if (
    __agentCliValue == null ||
    (typeof __agentCliValue !== 'object' && typeof __agentCliValue !== 'function') ||
    typeof __agentCliValue.then !== 'function'
  ) {
    return __agentCliValue;
  }${subscription}
  var __agentCliMarker = {};
  __agentCliMarker[${marker}] = ${key};
  return __agentCliMarker;
})()`;
}

/**
 * Read the outcome parked under a nonce, and take it out of the app once it is read.
 *
 * A value that cannot be serialized is described instead: the runtime returns `undefined` for a
 * function or a cyclic object under `returnByValue`, and an outcome reported as "no value" would be
 * indistinguishable from a promise that resolved with `undefined`.
 */
export function buildPromisePollExpression(nonce: string): string {
  const key = JSON.stringify(nonce);
  return `(function () {
  var __agentCliGlobal = typeof globalThis !== 'undefined' ? globalThis : this;
  var __agentCliSlots = __agentCliGlobal.${SLOTS_GLOBAL};
  var __agentCliSlot = __agentCliSlots ? __agentCliSlots[${key}] : undefined;
  if (!__agentCliSlot) {
    return { state: 'missing' };
  }
  if (__agentCliSlot.state === 'pending') {
    return { state: 'pending' };
  }
  delete __agentCliSlots[${key}];
  if (__agentCliSlot.state !== 'fulfilled') {
    return { state: __agentCliSlot.state, reason: __agentCliSlot.reason };
  }
  var __agentCliOut = { state: 'fulfilled', type: __agentCliSlot.type };
  var __agentCliSerializable = false;
  try {
    __agentCliSerializable = JSON.stringify(__agentCliSlot.value) !== undefined;
  } catch (__agentCliError) {}
  if (__agentCliSerializable) {
    __agentCliOut.value = __agentCliSlot.value;
  } else {
    try {
      __agentCliOut.description = String(__agentCliSlot.value);
    } catch (__agentCliError) {
      __agentCliOut.description = 'The settled value could not be described.';
    }
  }
  return __agentCliOut;
})()`;
}

/**
 * Stop watching a promise that outlived the wait, so the app does not hold its value forever.
 *
 * Best effort: the caller is already reporting a timeout, and a cleanup that fails changes nothing
 * about that answer.
 */
export function buildPromiseReleaseExpression(nonce: string): string {
  const key = JSON.stringify(nonce);
  return `(function () {
  var __agentCliGlobal = typeof globalThis !== 'undefined' ? globalThis : this;
  if (__agentCliGlobal.${SLOTS_GLOBAL}) {
    delete __agentCliGlobal.${SLOTS_GLOBAL}[${key}];
  }
  return true;
})()`;
}

/**
 * Runtimes' own words for "this did not compile".
 *
 * Hermes does not throw a `SyntaxError` for an expression it cannot parse; it reports
 * `Compiling JS failed: 2:25:invalid expression, sourceURL:`
 * [observed — Expo Go on iOS, SDK 57 / RN 0.86.2, 2026-08-23]. Matching only `SyntaxError` left the
 * fallback below unreachable on the one runtime this command actually talks to.
 */
const COMPILE_FAILURE_PATTERNS = [/^SyntaxError\b/, /^Compiling JS failed\b/];

/**
 * Whether an exception is the wrapper rejecting something that is a statement, not an expression.
 *
 * `var x = 1` is a valid thing to evaluate in a runtime and an invalid thing to put in an
 * assignment, so wrapping it turns a working command into a compile failure. The caller answers
 * that by evaluating the expression exactly as it was written, which is what it did before the
 * wrapper existed — a promise cannot be settled that way, and nothing else changes.
 *
 * A syntax error in the caller's own expression lands here too. Re-running it unwrapped reports the
 * runtime's own complaint about their code, which is the answer they want either way.
 */
export function looksLikeWrapperSyntaxError(exceptionText: string | undefined): boolean {
  return exceptionText != null && COMPILE_FAILURE_PATTERNS.some((rule) => rule.test(exceptionText));
}
