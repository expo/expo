// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include "IRuntimeCompat.h"

namespace jsi = facebook::jsi;

// All pointers in this header are non-null.
#pragma clang assume_nonnull begin

namespace expo {

/**
 Creates a standalone Hermes runtime, for the standalone `JavaScriptRuntime`. Its host drains the
 microtask queue with `drainMicrotasks` after each task.
 */
jsi::Runtime *createHermesRuntime();

/**
 Destroys a `jsi::Runtime` created by `createHermesRuntime()`. Since the runtime is imported into
 Swift as an immortal reference type (no ARC-managed lifetime), Swift can't `delete` it directly, so
 the standalone `JavaScriptRuntime` calls this from its `deinit` to free the runtime it owns. Must
 not be called on a runtime owned elsewhere (e.g. the React Native-provided one).
 */
inline void destroyRuntime(jsi::Runtime &runtime) {
  delete &runtime;
}

} // namespace expo

#pragma clang assume_nonnull end

#endif // __cplusplus
