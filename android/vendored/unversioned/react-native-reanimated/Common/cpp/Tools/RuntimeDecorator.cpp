#include "RuntimeDecorator.h"
#include <jsi/instrumentation.h>
#include <chrono>
#include <memory>
#include <unordered_map>
#include <utility>
#include "JsiUtils.h"
#include "ReanimatedHiddenHeaders.h"

namespace reanimated {

static const std::function<void(jsi::Runtime &, jsi::Value const &)> logValue =
    [](jsi::Runtime &rt, jsi::Value const &value) {
      if (value.isString()) {
        Logger::log(value.getString(rt).utf8(rt).c_str());
      } else if (value.isNumber()) {
        Logger::log(value.getNumber());
      } else if (value.isUndefined()) {
        Logger::log("undefined");
      } else {
        Logger::log("unsupported value type");
      }
    };

std::unordered_map<RuntimePointer, RuntimeType>
    &RuntimeDecorator::runtimeRegistry() {
  static std::unordered_map<RuntimePointer, RuntimeType> runtimeRegistry;
  return runtimeRegistry;
}

void RuntimeDecorator::registerRuntime(
    jsi::Runtime *runtime,
    RuntimeType runtimeType) {
  runtimeRegistry().insert({runtime, runtimeType});
}

void RuntimeDecorator::decorateRuntime(
    jsi::Runtime &rt,
    const std::string &label) {
  // This property will be used to find out if a runtime is a custom worklet
  // runtime (e.g. UI, VisionCamera frame processor, ...)
  rt.global().setProperty(rt, "_WORKLET", jsi::Value(true));
  // This property will be used for debugging
  rt.global().setProperty(
      rt, "_LABEL", jsi::String::createFromAscii(rt, label));

  rt.global().setProperty(rt, "global", rt.global());

#ifdef DEBUG
  auto evalWithSourceUrl = [](jsi::Runtime &rt,
                              const jsi::Value &thisValue,
                              const jsi::Value *args,
                              size_t count) -> jsi::Value {
    auto code = std::make_shared<const jsi::StringBuffer>(
        args[0].asString(rt).utf8(rt));
    std::string url;
    if (count > 1 && args[1].isString()) {
      url = args[1].asString(rt).utf8(rt);
    }

    return rt.evaluateJavaScript(code, url);
  };

  rt.global().setProperty(
      rt,
      "evalWithSourceUrl",
      jsi::Function::createFromHostFunction(
          rt,
          jsi::PropNameID::forAscii(rt, "evalWithSourceUrl"),
          1,
          evalWithSourceUrl));
#endif // DEBUG

  jsi_utils::installJsiFunction(rt, "_log", logValue);
}

void RuntimeDecorator::decorateUIRuntime(
    jsi::Runtime &rt,
    const UpdatePropsFunction updateProps,
    const MeasureFunction measure,
#ifdef RCT_NEW_ARCH_ENABLED
    const RemoveShadowNodeFromRegistryFunction removeShadowNodeFromRegistry,
    const DispatchCommandFunction dispatchCommand,
#else
    const ScrollToFunction scrollTo,
#endif
    const RequestFrameFunction requestFrame,
    const ScheduleOnJSFunction scheduleOnJS,
    const MakeShareableCloneFunction makeShareableClone,
    const UpdateDataSynchronouslyFunction updateDataSynchronously,
    const TimeProviderFunction getCurrentTime,
    const SetGestureStateFunction setGestureState,
    const ProgressLayoutAnimationFunction progressLayoutAnimationFunction,
    const EndLayoutAnimationFunction endLayoutAnimationFunction,
    const MaybeFlushUIUpdatesQueueFunction maybeFlushUIUpdatesQueueFunction) {
  RuntimeDecorator::decorateRuntime(rt, "UI");
  rt.global().setProperty(rt, "_UI", jsi::Value(true));

#ifdef RCT_NEW_ARCH_ENABLED
  jsi_utils::installJsiFunction(rt, "_updatePropsFabric", updateProps);
  jsi_utils::installJsiFunction(
      rt, "_removeShadowNodeFromRegistry", removeShadowNodeFromRegistry);
  jsi_utils::installJsiFunction(rt, "_dispatchCommand", dispatchCommand);
  jsi_utils::installJsiFunction(rt, "_measure", measure);
#else
  jsi_utils::installJsiFunction(rt, "_updatePropsPaper", updateProps);
  jsi_utils::installJsiFunction(rt, "_scrollTo", scrollTo);

  std::function<jsi::Value(jsi::Runtime &, int)> _measure =
      [measure](jsi::Runtime &rt, int viewTag) -> jsi::Value {
    auto result = measure(viewTag);
    jsi::Object resultObject(rt);
    for (auto &i : result) {
      resultObject.setProperty(rt, i.first.c_str(), i.second);
    }
    return resultObject;
  };

  jsi_utils::installJsiFunction(rt, "_measure", _measure);
#endif // RCT_NEW_ARCH_ENABLED

  jsi_utils::installJsiFunction(rt, "requestAnimationFrame", requestFrame);
  jsi_utils::installJsiFunction(rt, "_scheduleOnJS", scheduleOnJS);
  jsi_utils::installJsiFunction(rt, "_makeShareableClone", makeShareableClone);
  jsi_utils::installJsiFunction(
      rt, "_updateDataSynchronously", updateDataSynchronously);

  auto performanceNow = [getCurrentTime](
                            jsi::Runtime &rt,
                            const jsi::Value &thisValue,
                            const jsi::Value *args,
                            size_t count) -> jsi::Value {
    return jsi::Value(getCurrentTime());
  };
  jsi::Object performance(rt);
  performance.setProperty(
      rt,
      "now",
      jsi::Function::createFromHostFunction(
          rt, jsi::PropNameID::forAscii(rt, "now"), 0, performanceNow));
  rt.global().setProperty(rt, "performance", performance);

  // layout animation
  jsi_utils::installJsiFunction(
      rt, "_notifyAboutProgress", progressLayoutAnimationFunction);
  jsi_utils::installJsiFunction(
      rt, "_notifyAboutEnd", endLayoutAnimationFunction);

  jsi_utils::installJsiFunction(rt, "_setGestureState", setGestureState);
  jsi_utils::installJsiFunction(
      rt, "_maybeFlushUIUpdatesQueue", maybeFlushUIUpdatesQueueFunction);
}

} // namespace reanimated
