#pragma once

#include "ABI39_0_0PlatformDepMethodsHolder.h"
#include <stdio.h>
#include <ABI39_0_0jsi/ABI39_0_0jsi.h>

using namespace ABI39_0_0facebook;

namespace ABI39_0_0reanimated {

using RequestFrameFunction = std::function<void(std::function<void(double)>)>;

class RuntimeDecorator {
public:
  static void addNativeObjects(jsi::Runtime &rt,
                               UpdaterFunction updater,
                               RequestFrameFunction requestFrame,
                               ScrollToFunction scrollTo,
                               MeasuringFunction measure);
};

}
