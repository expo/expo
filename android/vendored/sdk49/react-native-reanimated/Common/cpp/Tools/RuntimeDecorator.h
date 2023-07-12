#pragma once

#include <jsi/jsi.h>
#include <stdio.h>
#include <memory>
#include <string>
#include <unordered_map>
#include "PlatformDepMethodsHolder.h"

using namespace facebook;

namespace reanimated {

using RequestFrameFunction =
    std::function<void(jsi::Runtime &, const jsi::Value &)>;
using ScheduleOnJSFunction =
    std::function<void(jsi::Runtime &, const jsi::Value &, const jsi::Value &)>;
using MakeShareableCloneFunction =
    std::function<jsi::Value(jsi::Runtime &, const jsi::Value &)>;
using UpdateDataSynchronouslyFunction =
    std::function<void(jsi::Runtime &, const jsi::Value &, const jsi::Value &)>;

enum RuntimeType {
  /**
   Represents any runtime that supports the concept of workletization
   */
  Worklet,
  /**
   Represents the Reanimated UI worklet runtime specifically
   */
  UI
};
typedef jsi::Runtime *RuntimePointer;

class RuntimeDecorator {
 public:
  static void decorateRuntime(jsi::Runtime &rt, const std::string &label);
  static void decorateUIRuntime(
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
      const MaybeFlushUIUpdatesQueueFunction maybeFlushUIUpdatesQueueFunction);

  /**
   Returns true if the given Runtime is the Reanimated UI-Thread Runtime.
   */
  inline static bool isUIRuntime(jsi::Runtime &rt);
  /**
   Returns true if the given Runtime is a Runtime that supports the concept of
   Workletization. (REA, Vision, ...)
   */
  inline static bool isWorkletRuntime(jsi::Runtime &rt);
  /**
   Returns true if the given Runtime is the default React-JS Runtime.
   */
  inline static bool isReactRuntime(jsi::Runtime &rt);
  /**
   Register the given Runtime. This function is required for every
   RuntimeManager, otherwise future runtime checks will fail.
   */
  static void registerRuntime(jsi::Runtime *runtime, RuntimeType runtimeType);

 private:
  static std::unordered_map<RuntimePointer, RuntimeType> &runtimeRegistry();
};

inline bool RuntimeDecorator::isUIRuntime(jsi::Runtime &rt) {
  auto iterator = runtimeRegistry().find(&rt);
  if (iterator == runtimeRegistry().end())
    return false;
  return iterator->second == RuntimeType::UI;
}

inline bool RuntimeDecorator::isWorkletRuntime(jsi::Runtime &rt) {
  auto iterator = runtimeRegistry().find(&rt);
  if (iterator == runtimeRegistry().end())
    return false;
  auto type = iterator->second;
  return type == RuntimeType::UI || type == RuntimeType::Worklet;
}

inline bool RuntimeDecorator::isReactRuntime(jsi::Runtime &rt) {
  auto iterator = runtimeRegistry().find(&rt);
  if (iterator == runtimeRegistry().end())
    return true;
  return false;
}

} // namespace reanimated
