#include "ReanimatedRuntime.h"

#include <cxxreact/MessageQueueThread.h>
#include <jsi/jsi.h>

#include <memory>
#include <utility>

#if JS_RUNTIME_HERMES
#include "ReanimatedHermesRuntime.h"
#elif JS_RUNTIME_V8
#include <v8runtime/V8RuntimeFactory.h>
#else
#if REACT_NATIVE_MINOR_VERSION >= 71
#include <jsc/JSCRuntime.h>
#else
#include <jsi/JSCRuntime.h>
#endif // REACT_NATIVE_MINOR_VERSION
#endif // JS_RUNTIME

namespace reanimated {

using namespace facebook;
using namespace react;

std::shared_ptr<jsi::Runtime> ReanimatedRuntime::make(
    jsi::Runtime *rnRuntime,
    std::shared_ptr<MessageQueueThread> jsQueue) {
#if JS_RUNTIME_HERMES
  std::unique_ptr<facebook::hermes::HermesRuntime> runtime =
      facebook::hermes::makeHermesRuntime();

  // We don't call `jsQueue->quitSynchronous()` here, since it will be done
  // later in ReanimatedHermesRuntime

  return std::make_shared<ReanimatedHermesRuntime>(std::move(runtime), jsQueue);
#elif JS_RUNTIME_V8
  // This is required by iOS, because there is an assertion in the destructor
  // that the thread was indeed `quit` before.
  jsQueue->quitSynchronous();

  auto config = std::make_unique<rnv8::V8RuntimeConfig>();
  config->enableInspector = false;
  config->appName = "reanimated";
  return rnv8::createSharedV8Runtime(rnRuntime, std::move(config));
#else
  // This is required by iOS, because there is an assertion in the destructor
  // that the thread was indeed `quit` before
  jsQueue->quitSynchronous();

  return facebook::jsc::makeJSCRuntime();
#endif
}

} // namespace reanimated
