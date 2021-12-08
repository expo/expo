#pragma once

#include <jsi/jsi.h>
#include <stdio.h>
#include <string>
#include <utility>
#include <vector>

using namespace facebook;

namespace reanimated {

using UpdaterFunction = std::function<void(
    jsi::Runtime &rt,
    int viewTag,
    const jsi::Value &viewName,
    const jsi::Object &object)>;
using RequestRender =
    std::function<void(std::function<void(double)>, jsi::Runtime &rt)>;
using ScrollToFunction = std::function<void(int, double, double, bool)>;
using MeasuringFunction =
    std::function<std::vector<std::pair<std::string, double>>(int)>;
using TimeProviderFunction = std::function<double(void)>;
using SetGestureStateFunction = std::function<void(int, int)>;

struct PlatformDepMethodsHolder {
  RequestRender requestRender;
  UpdaterFunction updaterFunction;
  ScrollToFunction scrollToFunction;
  MeasuringFunction measuringFunction;
  TimeProviderFunction getCurrentTime;
  SetGestureStateFunction setGestureStateFunction;
};

} // namespace reanimated
