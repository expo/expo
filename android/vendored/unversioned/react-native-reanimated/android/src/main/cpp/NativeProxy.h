#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/JavaScriptExecutorHolder.h>
#include <react/jni/WritableNativeMap.h>

#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include "AndroidScheduler.h"
#include "JNIHelper.h"
#include "LayoutAnimations.h"
#include "NativeReanimatedModule.h"
#include "Scheduler.h"

namespace reanimated {

using namespace facebook;
using namespace facebook::jni;

class AnimationFrameCallback : public HybridClass<AnimationFrameCallback> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/NativeProxy$AnimationFrameCallback;";

  void onAnimationFrame(double timestampMs) {
    callback_(timestampMs);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod(
            "onAnimationFrame", AnimationFrameCallback::onAnimationFrame),
    });
  }

 private:
  friend HybridBase;

  explicit AnimationFrameCallback(std::function<void(double)> callback)
      : callback_(std::move(callback)) {}

  std::function<void(double)> callback_;
};

class EventHandler : public HybridClass<EventHandler> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/NativeProxy$EventHandler;";

  void receiveEvent(
      jni::alias_ref<JString> eventKey,
      jni::alias_ref<react::WritableMap> event) {
    std::string eventAsString = "{NativeMap:null}";
    if (event != nullptr) {
      try {
        eventAsString = event->toString();
      } catch (std::exception &) {
        // Events from other libraries may contain NaN or INF values which
        // cannot be represented in JSON. See
        // https://github.com/software-mansion/react-native-reanimated/issues/1776
        // for details.
        return;
      }
    }
    handler_(eventKey->toString(), eventAsString);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("receiveEvent", EventHandler::receiveEvent),
    });
  }

 private:
  friend HybridBase;

  explicit EventHandler(std::function<void(std::string, std::string)> handler)
      : handler_(std::move(handler)) {}

  std::function<void(std::string, std::string)> handler_;
};

class SensorSetter : public HybridClass<SensorSetter> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/NativeProxy$SensorSetter;";

  void sensorSetter(jni::alias_ref<JArrayFloat> value) {
    size_t size = value->size();
    auto elements = value->getRegion(0, size);
    double array[7];
    for (int i = 0; i < size; i++) {
      array[i] = elements[i];
    }
    callback_(array);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("sensorSetter", SensorSetter::sensorSetter),
    });
  }

 private:
  friend HybridBase;

  explicit SensorSetter(std::function<void(double[])> callback)
      : callback_(std::move(callback)) {}

  std::function<void(double[])> callback_;
};

class KeyboardEventDataUpdater : public HybridClass<KeyboardEventDataUpdater> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/NativeProxy$KeyboardEventDataUpdater;";

  void keyboardEventDataUpdater(int keyboardState, int height) {
    callback_(keyboardState, height);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod(
            "keyboardEventDataUpdater",
            KeyboardEventDataUpdater::keyboardEventDataUpdater),
    });
  }

 private:
  friend HybridBase;

  explicit KeyboardEventDataUpdater(std::function<void(int, int)> callback)
      : callback_(std::move(callback)) {}

  std::function<void(int, int)> callback_;
};

class NativeProxy : public jni::HybridClass<NativeProxy> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/NativeProxy;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis,
      jlong jsContext,
      jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>
          jsCallInvokerHolder,
      jni::alias_ref<AndroidScheduler::javaobject> scheduler,
      jni::alias_ref<LayoutAnimations::javaobject> layoutAnimations);
  static void registerNatives();

  ~NativeProxy();

 private:
  friend HybridBase;
  jni::global_ref<NativeProxy::javaobject> javaPart_;
  jsi::Runtime *runtime_;
  std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
  std::shared_ptr<NativeReanimatedModule> _nativeReanimatedModule;
  std::shared_ptr<Scheduler> scheduler_;
  jni::global_ref<LayoutAnimations::javaobject> layoutAnimations;

  void installJSIBindings();
  bool isAnyHandlerWaitingForEvent(std::string);
  void requestRender(std::function<void(double)> onRender);
  void registerEventHandler(
      std::function<void(std::string, std::string)> handler);
  void updateProps(jsi::Runtime &rt, int viewTag, const jsi::Object &props);
  void scrollTo(int viewTag, double x, double y, bool animated);
  void setGestureState(int handlerTag, int newState);
  std::vector<std::pair<std::string, double>> measure(int viewTag);
  int registerSensor(
      int sensorType,
      int interval,
      std::function<void(double[])> setter);
  void unregisterSensor(int sensorId);
  void configureProps(
      jsi::Runtime &rt,
      const jsi::Value &uiProps,
      const jsi::Value &nativeProps);
  int subscribeForKeyboardEvents(
      std::function<void(int, int)> keyboardEventDataUpdater);
  void unsubscribeFromKeyboardEvents(int listenerId);

  explicit NativeProxy(
      jni::alias_ref<NativeProxy::jhybridobject> jThis,
      jsi::Runtime *rt,
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
      std::shared_ptr<Scheduler> scheduler,
      jni::global_ref<LayoutAnimations::javaobject> _layoutAnimations);
};

} // namespace reanimated
