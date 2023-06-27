#pragma once

#include <jsi/jsi.h>

#ifdef RCT_NEW_ARCH_ENABLED
#include <react/renderer/core/ReactPrimitives.h>
#endif

#include <string>
#include <utility>
#include <vector>

using namespace facebook;

#ifdef RCT_NEW_ARCH_ENABLED
using namespace react;
#endif

namespace reanimated {

#ifdef RCT_NEW_ARCH_ENABLED

using SynchronouslyUpdateUIPropsFunction =
    std::function<void(jsi::Runtime &rt, Tag tag, const jsi::Value &props)>;
using UpdatePropsFunction = std::function<void(
    jsi::Runtime &rt,
    const jsi::Value &shadowNodeValue,
    const jsi::Value &props)>;
using RemoveShadowNodeFromRegistryFunction =
    std::function<void(jsi::Runtime &rt, const jsi::Value &tag)>;
using DispatchCommandFunction = std::function<void(
    jsi::Runtime &rt,
    const jsi::Value &shadowNodeValue,
    const jsi::Value &commandNameValue,
    const jsi::Value &argsValue)>;
using MeasureFunction = std::function<
    jsi::Value(jsi::Runtime &rt, const jsi::Value &shadowNodeValue)>;

#else

using UpdatePropsFunction = std::function<void(
    jsi::Runtime &rt,
    int viewTag,
    const jsi::Value &viewName,
    jsi::Object object)>;
using ScrollToFunction = std::function<void(int, double, double, bool)>;
using MeasureFunction =
    std::function<std::vector<std::pair<std::string, double>>(int)>;

#endif // RCT_NEW_ARCH_ENABLED

using RequestRender =
    std::function<void(std::function<void(double)>, jsi::Runtime &rt)>;
using TimeProviderFunction = std::function<double(void)>;

using ProgressLayoutAnimationFunction =
    std::function<void(int, jsi::Object newProps, bool isSharedTransition)>;
using EndLayoutAnimationFunction = std::function<void(int, bool, bool)>;

using RegisterSensorFunction =
    std::function<int(int, int, int, std::function<void(double[], int)>)>;
using UnregisterSensorFunction = std::function<void(int)>;
using SetGestureStateFunction = std::function<void(int, int)>;
using ConfigurePropsFunction = std::function<void(
    jsi::Runtime &rt,
    const jsi::Value &uiProps,
    const jsi::Value &nativeProps)>;
using KeyboardEventSubscribeFunction =
    std::function<int(std::function<void(int, int)>, bool)>;
using KeyboardEventUnsubscribeFunction = std::function<void(int)>;
using MaybeFlushUIUpdatesQueueFunction = std::function<void()>;

struct PlatformDepMethodsHolder {
  RequestRender requestRender;
#ifdef RCT_NEW_ARCH_ENABLED
  SynchronouslyUpdateUIPropsFunction synchronouslyUpdateUIPropsFunction;
#else
  UpdatePropsFunction updatePropsFunction;
  ScrollToFunction scrollToFunction;
  MeasureFunction measureFunction;
  ConfigurePropsFunction configurePropsFunction;
#endif
  TimeProviderFunction getCurrentTime;
  ProgressLayoutAnimationFunction progressLayoutAnimation;
  EndLayoutAnimationFunction endLayoutAnimation;
  RegisterSensorFunction registerSensor;
  UnregisterSensorFunction unregisterSensor;
  SetGestureStateFunction setGestureStateFunction;
  KeyboardEventSubscribeFunction subscribeForKeyboardEvents;
  KeyboardEventUnsubscribeFunction unsubscribeFromKeyboardEvents;
  MaybeFlushUIUpdatesQueueFunction maybeFlushUIUpdatesQueueFunction;
};

} // namespace reanimated
