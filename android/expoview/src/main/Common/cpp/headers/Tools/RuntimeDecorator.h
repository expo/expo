#pragma once

#include <stdio.h>
#include <jsi/jsi.h>
#include "PlatformDepMethodsHolder.h"

namespace reanimated {

using namespace facebook;

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
