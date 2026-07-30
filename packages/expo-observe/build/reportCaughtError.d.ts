/**
 * Reports a caught value as a non-fatal `reportedByUser`-source error through the AppMetrics module,
 * shared by the native and web `Observe.reportError` implementations.
 *
 * Never throws: it's called from a `catch` block, so a failure here (a pathological thrown value, or
 * a native call that rejects the payload) must not turn a handled error into an unhandled one.
 */
export declare function reportCaughtError(error: unknown): void;
//# sourceMappingURL=reportCaughtError.d.ts.map