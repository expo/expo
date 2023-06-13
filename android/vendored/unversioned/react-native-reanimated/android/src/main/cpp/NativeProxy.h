#pragma once

#ifdef RCT_NEW_ARCH_ENABLED
#include <react/fabric/JFabricUIManager.h>
#endif

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
      "Lcom/swmansion/reanimated/nativeProxy/AnimationFrameCallback;";

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
      "Lcom/swmansion/reanimated/nativeProxy/EventHandler;";

  void receiveEvent(
      jni::alias_ref<JString> eventKey,
      jni::alias_ref<react::WritableMap> event) {
    handler_(eventKey, event);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("receiveEvent", EventHandler::receiveEvent),
    });
  }

 private:
  friend HybridBase;

  explicit EventHandler(std::function<void(
                            jni::alias_ref<JString>,
                            jni::alias_ref<react::WritableMap>)> handler)
      : handler_(std::move(handler)) {}

  std::function<
      void(jni::alias_ref<JString>, jni::alias_ref<react::WritableMap>)>
      handler_;
};

class SensorSetter : public HybridClass<SensorSetter> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/nativeProxy/SensorSetter;";

  void sensorSetter(jni::alias_ref<JArrayFloat> value, int orientationDegrees) {
    size_t size = value->size();
    auto elements = value->getRegion(0, size);
    double array[7];
    for (int i = 0; i < size; i++) {
      array[i] = elements[i];
    }
    callback_(array, orientationDegrees);
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("sensorSetter", SensorSetter::sensorSetter),
    });
  }

 private:
  friend HybridBase;

  explicit SensorSetter(std::function<void(double[], int)> callback)
      : callback_(std::move(callback)) {}

  std::function<void(double[], int)> callback_;
};

class KeyboardEventDataUpdater : public HybridClass<KeyboardEventDataUpdater> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/nativeProxy/KeyboardEventDataUpdater;";

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
      jni::alias_ref<LayoutAnimations::javaobject> layoutAnimations
#ifdef RCT_NEW_ARCH_ENABLED
      ,
      jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
          fabricUIManager
#endif
      /**/);
  static void registerNatives();

  ~NativeProxy();

 private:
  friend HybridBase;
  jni::global_ref<NativeProxy::javaobject> javaPart_;
  jsi::Runtime *runtime_;
  std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker_;
  std::shared_ptr<NativeReanimatedModule> nativeReanimatedModule_;
  jni::global_ref<LayoutAnimations::javaobject> layoutAnimations_;
  std::shared_ptr<Scheduler> scheduler_;
#ifdef RCT_NEW_ARCH_ENABLED
  std::shared_ptr<NewestShadowNodesRegistry> newestShadowNodesRegistry_;

// removed temporary, new event listener mechanism need fix on the RN side
// std::shared_ptr<facebook::react::Scheduler> reactScheduler_;
// std::shared_ptr<EventListener> eventListener_;
#endif
#ifdef RCT_NEW_ARCH_ENABLED
  void installJSIBindings(
      jni::alias_ref<JavaMessageQueueThread::javaobject> messageQueueThread,
      jni::alias_ref<JFabricUIManager::javaobject> fabricUIManager);
  void synchronouslyUpdateUIProps(
      jsi::Runtime &rt,
      Tag viewTag,
      const jsi::Value &uiProps);
#else
  void installJSIBindings(
      jni::alias_ref<JavaMessageQueueThread::javaobject> messageQueueThread);
#endif
  PlatformDepMethodsHolder getPlatformDependentMethods();
  void setGlobalProperties(
      jsi::Runtime &jsRuntime,
      const std::shared_ptr<jsi::Runtime> &reanimatedRuntime);
  void setupLayoutAnimations();

  double getCurrentTime();
  bool isAnyHandlerWaitingForEvent(std::string);
  void performOperations();
  void requestRender(std::function<void(double)> onRender, jsi::Runtime &rt);
  void registerEventHandler();
  void maybeFlushUIUpdatesQueue();
  void setGestureState(int handlerTag, int newState);
  int registerSensor(
      int sensorType,
      int interval,
      int iosReferenceFrame,
      std::function<void(double[], int)> setter);
  void unregisterSensor(int sensorId);
  int subscribeForKeyboardEvents(
      std::function<void(int, int)> keyboardEventDataUpdater,
      bool isStatusBarTranslucent);
  void unsubscribeFromKeyboardEvents(int listenerId);
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
  jsi::Value
  obtainProp(jsi::Runtime &rt, const int viewTag, const jsi::String &propName);
  void configureProps(
      jsi::Runtime &rt,
      const jsi::Value &uiProps,
      const jsi::Value &nativeProps);
  void updateProps(
      jsi::Runtime &rt,
      int viewTag,
      const jsi::Value &viewName,
      const jsi::Object &props);
  void scrollTo(int viewTag, double x, double y, bool animated);
  std::vector<std::pair<std::string, double>> measure(int viewTag);
#endif
  void handleEvent(
      jni::alias_ref<JString> eventKey,
      jni::alias_ref<react::WritableMap> event);

  void progressLayoutAnimation(
      int tag,
      const jsi::Object &newProps,
      bool isSharedTransition);

  /***
   * Wraps a method of `NativeProxy` in a function object capturing `this`
   * @tparam TReturn return type of passed method
   * @tparam TParams paramater types of passed method
   * @param methodPtr pointer to method to be wrapped
   * @return a function object with the same signature as the method, calling
   * that method on `this`
   */
  template <class TReturn, class... TParams>
  std::function<TReturn(TParams...)> bindThis(
      TReturn (NativeProxy::*methodPtr)(TParams...)) {
    return [this, methodPtr](TParams &&...args) {
      return (this->*methodPtr)(std::forward<TParams>(args)...);
    };
  }

  template <class Signature>
  JMethod<Signature> getJniMethod(std::string const &methodName) {
    return javaPart_->getClass()->getMethod<Signature>(methodName.c_str());
  }

  explicit NativeProxy(
      jni::alias_ref<NativeProxy::jhybridobject> jThis,
      jsi::Runtime *rt,
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
      std::shared_ptr<Scheduler> scheduler,
      jni::global_ref<LayoutAnimations::javaobject> _layoutAnimations
#ifdef RCT_NEW_ARCH_ENABLED
      ,
      jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
          fabricUIManager
#endif
      /**/);
};

} // namespace reanimated
