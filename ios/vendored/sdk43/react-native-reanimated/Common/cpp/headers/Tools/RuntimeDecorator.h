#pragma once

#include "PlatformDepMethodsHolder.h"
#include <stdio.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

using namespace ABI43_0_0facebook;

namespace ABI43_0_0reanimated {

using RequestFrameFunction = std::function<void(std::function<void(double)>)>;

class RuntimeDecorator {
public:
  static void decorateRuntime(jsi::Runtime &rt, std::string label);
  static void decorateUIRuntime(jsi::Runtime &rt,
                                UpdaterFunction updater,
                                RequestFrameFunction requestFrame,
                                ScrollToFunction scrollTo,
                                MeasuringFunction measure,
                                TimeProviderFunction getCurrentTime);
  
  /**
   Returns true if the given Runtime is the Reanimated UI-Thread Runtime.
   */
  static bool isUIRuntime(jsi::Runtime &rt);
  /**
   Returns true if the given Runtime is a Runtime that supports Workletization. (REA, Vision, ...)
   */
  static bool isWorkletRuntime(jsi::Runtime &rt);
  /**
   Returns true if the given Runtime is the default ABI43_0_0React-JS Runtime.
   */
  static bool isReactRuntime(jsi::Runtime &rt);
};

}
