#ifndef PlatformDepMethods_h
#define PlatformDepMethods_h

#include <stdio.h>
#include <jsi/jsi.h>

using namespace facebook;

using UpdaterFunction = std::function<void(jsi::Runtime &rt, int viewTag, const jsi::Object& object)>;
using RequestRender = std::function<void(std::function<void(double)>)>;
using ScrollToFunction = std::function<void(int, double, double, bool)>;
using MeasuringFunction = std::function<std::vector<std::pair<std::string, double>>(int)>;

struct PlatformDepMethodsHolder {
  RequestRender requestRender;
  UpdaterFunction updaterFunction;
  ScrollToFunction scrollToFunction;
  MeasuringFunction measuringFunction;
};

#endif /* PlatformDepMethods_h */
