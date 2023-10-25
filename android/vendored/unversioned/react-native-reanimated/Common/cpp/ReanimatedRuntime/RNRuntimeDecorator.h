#pragma once

#include <jsi/jsi.h>

#include <memory>

#include "NativeReanimatedModule.h"

using namespace facebook;

namespace reanimated {

class RNRuntimeDecorator {
 public:
  static void decorate(
      jsi::Runtime &rnRuntime,
      const std::shared_ptr<NativeReanimatedModule> &nativeReanimatedModule,
      const bool isReducedMotion);
};

} // namespace reanimated
