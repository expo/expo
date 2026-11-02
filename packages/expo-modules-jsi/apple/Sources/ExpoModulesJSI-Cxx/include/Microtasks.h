// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include "IRuntimeCompat.h"

namespace jsi = facebook::jsi;

// All pointers in this header are non-null.
#pragma clang assume_nonnull begin

namespace expo {

/**
 Runs the runtime's microtasks until the queue is empty, like React Native's microtask checkpoint
 after each task. Returns `false` and stores a `CppError` when a microtask throws or the queue does
 not empty within the retries bound. A call during a checkpoint of the same runtime does nothing.
 */
bool drainMicrotasks(jsi::IRuntime &runtime);

// Queues `callback` in the runtime's microtask queue, next to `drainMicrotasks` that runs it.
inline void queueMicrotask(jsi::IRuntime &runtime, const jsi::Function &callback) {
  runtime.queueMicrotask(callback);
}

} // namespace expo

#pragma clang assume_nonnull end

#endif // __cplusplus
