#include "JSIUtils.h"

#include <hermes/hermes.h>

namespace expo {

jsi::Runtime* createHermesRuntime() {
  // The config React Native uses for its bridgeless runtime (`HermesInstance::createJSRuntime`), so
  // code runs on a standalone runtime as it does in an app. Most importantly, promise jobs go to the
  // native microtask queue, which the host drains with `drainMicrotasks` after each task. Sample
  // profiling is left out: nothing samples a standalone runtime, and it may cost about 1% in benchmarks.
  auto gcConfig = ::hermes::vm::GCConfig::Builder()
                      .withMaxHeapSize(3072u << 20)
                      .withName("ExpoStandalone")
                      .build();
  auto runtimeConfig = ::hermes::vm::RuntimeConfig::Builder()
                           .withGCConfig(gcConfig)
                           .withMicrotaskQueue(true)
                           .build();

  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime(runtimeConfig);
  return runtimePtr.release();
}

bool drainMicrotasks(jsi::IRuntime &runtime) {
  // Mirrors `RuntimeScheduler_Modern::performMicrotaskCheckpoint` in React Native: drain until the
  // queue is empty, resuming after a microtask throws, with the same bound on the number of attempts.
  // React Native reports each error to its error handler; here the first one is kept for the caller.
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
