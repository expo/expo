// Copyright 2026-present 650 Industries. All rights reserved.

#include "Microtasks.h"

#include <memory>
#include <unordered_set>

#include "CppError.h"

namespace expo {

// The runtimes whose microtask checkpoint runs on this thread. A nested checkpoint for a runtime runs
// on the same stack as the outer one, so a per-thread set keyed by runtime finds it, and two runtimes
// that share a thread stay independent.
static thread_local std::unordered_set<const jsi::IRuntime *> runtimesInCheckpoint;

bool drainMicrotasks(jsi::IRuntime &runtime) {
  // Mirrors `RuntimeScheduler_Modern::performMicrotaskCheckpoint` in React Native: drain until the
  // queue is empty, resuming after a microtask throws, with the same bound on the number of attempts.
  // React Native reports each error to its error handler; here the first one is kept for the caller.
  // Like React Native, a call from a microtask (through a host function) returns at once, so the
  // remaining microtasks run after the current one, not nested on its stack.
  if (!runtimesInCheckpoint.insert(&runtime).second) {
    return true;
  }
  struct CheckpointScope {
    const jsi::IRuntime *runtime;
    ~CheckpointScope() {
      runtimesInCheckpoint.erase(runtime);
    }
  } checkpointScope{&runtime};

  constexpr unsigned int retriesBound = 255;
  std::unique_ptr<jsi::JSError> firstError;
  bool isDrained = false;

  for (unsigned int retries = 0; retries < retriesBound && !isDrained; retries++) {
    try {
      isDrained = runtime.drainMicrotasks();
    } catch (jsi::JSError &error) {
      if (!firstError) {
        firstError = std::make_unique<jsi::JSError>(std::move(error));
      }
    } catch (std::exception &ex) {
      if (!firstError) {
        firstError = std::make_unique<jsi::JSError>(runtime, std::string("Non-JS exception: ") + ex.what());
      }
    }
  }
  if (!isDrained && !firstError) {
    firstError = std::make_unique<jsi::JSError>(runtime, "Hits microtasks retries bound.");
  }

  if (firstError) {
    CppError::setCurrent(std::move(*firstError));
    return false;
  }
  return true;
}

} // namespace expo
