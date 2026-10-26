#include "JSIUtils.h"

#include <hermes/hermes.h>

#include <unordered_set>

namespace expo {

jsi::Runtime* createHermesRuntime() {
  // The config React Native uses for its bridgeless runtime (`HermesInstance::createJSRuntime`), so
  // code runs on a standalone runtime as it does in an app. Most importantly, promise jobs go to the
  // native microtask queue, which the host drains with `drainMicrotasks` after each task. React Native's
  // 3 GB max heap is the Hermes default, so it isn't set here. Sample profiling is left out: nothing
  // samples a standalone runtime, and it may cost about 1% in benchmarks.
  auto gcConfig = ::hermes::vm::GCConfig::Builder()
                      .withName("ExpoStandalone")
                      .build();
  auto runtimeConfig = ::hermes::vm::RuntimeConfig::Builder()
                           .withGCConfig(gcConfig)
                           .withMicrotaskQueue(true)
                           .build();

  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime(runtimeConfig);
  return runtimePtr.release();
}

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
