#pragma once

// JS_RUNTIME_HERMES is only set on Android so we have to check __has_include
// on iOS.
#if __APPLE__ &&    \
    (__has_include( \
        <reacthermes/HermesExecutorFactory.h>) || __has_include(<hermes/hermes.h>))
#define JS_RUNTIME_HERMES 1
#endif

#include <cxxreact/MessageQueueThread.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>

namespace reanimated {

using namespace facebook;
using namespace react;

class ReanimatedRuntime {
 public:
  static std::shared_ptr<jsi::Runtime> make(
      jsi::Runtime &rnRuntime,
      const std::shared_ptr<MessageQueueThread> &jsQueue,
      const std::string &name);
};

} // namespace reanimated
