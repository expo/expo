# Native Back ownership and guarded navigation

A navigator can call `navigation.registerNativeBackNavigation()` and remove the
returned subscription when its native dispatcher is no longer available. Register
again after the navigator state key changes. This is an explicit capability, not
an inference from `state.type`: a JavaScript stack and a native stack share a
router type but do not have the same Android ownership.

The root's hardware Back listener remains in the JavaScript chain. With React
Native's optional `setNativeNavigationFallback` subscription method, it becomes a
fallback only while every focused navigator declares native ownership, the
focused chain is complete, no focused removal guard exists, and ordinary
navigation is stable. Unknown navigators and handlers keep the conservative
JavaScript path. Older React Native versions keep their existing behavior.

ExperimentalStack declares native ownership. The built-in Slot and Expo's
synthetic root delegate only while their own stack has no local Back history;
404/sitemap routing does not inherit the synthetic root's delegation.

A native preview commits using:

```ts
const pending = navigation.dispatchWithResult(
  { type: 'GO_BACK' },
  { expectedState: navigation.getState() },
  ({ status, state }) => {
    // Only "handled" changed navigation; settle/reject the native visual otherwise.
  }
);
```

The expected navigator state is compared structurally inside the reducer, after
preceding commands. Equivalent derived declared-route states are accepted, but
changed history, route identity or params are stale. Outcomes are `handled`,
`prevented`, `unhandled`, `stale`, `noop`, or `cancelled`, delivered once after the
result commits, including in production. Removal guards retain their existing
notifications. A later retry is a new transaction.

Guarded navigation requires a stable starting point. Older queued commands,
unresolved layouts, and suspended navigation—including externally started React
transitions—cause cancellation. Commands are tracked at their enqueue/dispatch
boundary until their result commits, including no-op and unhandled outcomes.
Guarded commits are urgent and do not cancel themselves; they still prevent a
second guarded request while pending. This avoids accepting a preview and later
undoing it when React rebases an older suspended transition. It does not replace
an older speculative navigation with a cached root-state snapshot.

`pending.remove()` cancels both observation and any uncommitted action. Call it
when account scope, focus, overlay or native ownership changes. It does not undo
already committed navigation. Settling a result is distinct from cancellation.
The reducer receives an immutable, read-only snapshot of cancelled operation
tokens. Weak references tie cancellation metadata to queued-operation lifetime,
without a permanent numeric tombstone set or an arbitrary expiry. This requires
WeakRef/WeakSet support (provided by React Native 0.88's bridgeless Hermes runtime).
Root unmount releases observers without invoking post-unmount callbacks.

These APIs do not provide Android gesture drawing, native callback arbitration or
system-exit animation. A native host must also preserve JavaScript interceptor
precedence, cancellation, lifecycle ownership and the actual preview destination.
