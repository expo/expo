#pragma once

#include <stdio.h>
#include <ABI40_0_0jsi/ABI40_0_0jsi.h>

using namespace ABI40_0_0facebook;

namespace ABI40_0_0reanimated
{

using UpdaterFunction = std::function<void(jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &object)>;
using RequestRender = std::function<void(std::function<void(double)>, jsi::Runtime &rt)>;
using ScrollToFunction = std::function<void(int, double, double, bool)>;
using MeasuringFunction = std::function<std::vector<std::pair<std::string, double>>(int)>;
using TimeProviderFunction = std::function<double(void)>;

struct PlatformDepMethodsHolder {
  RequestRender requestRender;
  UpdaterFunction updaterFunction;
  ScrollToFunction scrollToFunction;
  MeasuringFunction measuringFunction;
  TimeProviderFunction getCurrentTime;
};

}
