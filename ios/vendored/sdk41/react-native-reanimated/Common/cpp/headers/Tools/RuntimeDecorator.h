#pragma once

#include "PlatformDepMethodsHolder.h"
#include <stdio.h>
#include <ABI41_0_0jsi/ABI41_0_0jsi.h>

using namespace ABI41_0_0facebook;

namespace ABI41_0_0reanimated {

using RequestFrameFunction = std::function<void(std::function<void(double)>)>;

class RuntimeDecorator {
public:
  static void addNativeObjects(jsi::Runtime &rt,
                               UpdaterFunction updater,
                               RequestFrameFunction requestFrame,
                               ScrollToFunction scrollTo,
                               MeasuringFunction measure,
                               TimeProviderFunction getCurrentTime);
};

}
