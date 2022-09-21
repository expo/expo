#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/ReadableNativeMap.h>

#include <memory>
#include <string>

#if FOR_HERMES
#include <hermes/hermes.h>
#else
#include <jsi/JSCRuntime.h>
#endif

#include <android/log.h>
#include "AndroidErrorHandler.h"
#include "AndroidScheduler.h"
#include "LayoutAnimationsProxy.h"
#include "NativeProxy.h"
#include "PlatformDepMethodsHolder.h"

namespace reanimated {

using namespace facebook;
using namespace react;

NativeProxy::NativeProxy(
    jni::alias_ref<NativeProxy::javaobject> jThis,
    jsi::Runtime *rt,
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
    std::shared_ptr<Scheduler> scheduler,
    jni::global_ref<LayoutAnimations::javaobject> _layoutAnimations)
    : javaPart_(jni::make_global(jThis)),
      runtime_(rt),
      jsCallInvoker_(jsCallInvoker),
      scheduler_(scheduler),
      layoutAnimations(std::move(_layoutAnimations)) {}

NativeProxy::~NativeProxy() {
  runtime_->global().setProperty(
      *runtime_,
      jsi::PropNameID::forAscii(*runtime_, "__reanimatedModuleProxy"),
      jsi::Value::undefined());
}

jni::local_ref<NativeProxy::jhybriddata> NativeProxy::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>
        jsCallInvokerHolder,
    jni::alias_ref<AndroidScheduler::javaobject> androidScheduler,
    jni::alias_ref<LayoutAnimations::javaobject> layoutAnimations) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);
  return makeCxxInstance(
      jThis,
      (jsi::Runtime *)jsContext,
      jsCallInvoker,
      scheduler,
      make_global(layoutAnimations));
}

void NativeProxy::installJSIBindings() {
  auto propUpdater = [this](
                         jsi::Runtime &rt,
                         int viewTag,
                         const jsi::Value &viewName,
                         const jsi::Object &props) {
    // viewName is for iOS only, we skip it here
    this->updateProps(rt, viewTag, props);
  };

  auto getCurrentTime = [this]() {
    auto method =
        javaPart_->getClass()->getMethod<local_ref<JString>()>("getUptime");
    local_ref<JString> output = method(javaPart_.get());
    return static_cast<double>(
        std::strtoll(output->toStdString().c_str(), NULL, 10));
  };

  auto requestRender = [this, getCurrentTime](
                           std::function<void(double)> onRender,
                           jsi::Runtime &rt) {
    // doNoUse -> NodesManager passes here a timestamp from choreographer which
    // is useless for us as we use diffrent timer to better handle events. The
    // lambda is translated to NodeManager.OnAnimationFrame and treated just
    // like reanimated 1 frame callbacks which make use of the timestamp.
    auto wrappedOnRender = [getCurrentTime, &rt, onRender](double doNotUse) {
      jsi::Object global = rt.global();
      jsi::String frameTimestampName =
          jsi::String::createFromAscii(rt, "_frameTimestamp");
      double frameTimestamp = getCurrentTime();
      global.setProperty(rt, frameTimestampName, frameTimestamp);
      onRender(frameTimestamp);
      global.setProperty(rt, frameTimestampName, jsi::Value::undefined());
    };
    this->requestRender(std::move(wrappedOnRender));
  };

  auto propObtainer = [this](
                          jsi::Runtime &rt,
                          const int viewTag,
                          const jsi::String &propName) -> jsi::Value {
    auto method =
        javaPart_->getClass()
            ->getMethod<jni::local_ref<JString>(int, jni::local_ref<JString>)>(
                "obtainProp");
    local_ref<JString> propNameJStr =
        jni::make_jstring(propName.utf8(rt).c_str());
    auto result = method(javaPart_.get(), viewTag, propNameJStr);
    std::string str = result->toStdString();
    return jsi::Value(rt, jsi::String::createFromAscii(rt, str.c_str()));
  };

  auto measuringFunction =
      [this](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag);
  };

  auto scrollToFunction =
      [this](int viewTag, double x, double y, bool animated) -> void {
    scrollTo(viewTag, x, y, animated);
  };

  auto registerSensorFunction =
      [this](int sensorType, int interval, std::function<void(double[])> setter)
      -> int {
    return this->registerSensor(sensorType, interval, std::move(setter));
  };
  auto unregisterSensorFunction = [this](int sensorId) {
    unregisterSensor(sensorId);
  };

  auto setGestureStateFunction = [this](int handlerTag, int newState) -> void {
    setGestureState(handlerTag, newState);
  };
#if FOR_HERMES
  auto config =
      ::hermes::vm::RuntimeConfig::Builder().withEnableSampleProfiling(false);
  std::shared_ptr<jsi::Runtime> animatedRuntime =
      facebook::hermes::makeHermesRuntime(config.build());
#else
  std::shared_ptr<jsi::Runtime> animatedRuntime =
      facebook::jsc::makeJSCRuntime();
#endif
  auto workletRuntimeValue = runtime_->global()
    .getProperty(*runtime_, "ArrayBuffer")
    .asObject(*runtime_)
    .asFunction(*runtime_)
    .callAsConstructor(*runtime_, {static_cast<double>(sizeof(void*))});
  uintptr_t* workletRuntimeData = reinterpret_cast<uintptr_t*>(
    workletRuntimeValue
      .getObject(*runtime_)
      .getArrayBuffer(*runtime_)
      .data(*runtime_));
  workletRuntimeData[0] = reinterpret_cast<uintptr_t>(animatedRuntime.get());

  runtime_->global().setProperty(
      *runtime_,
      "_WORKLET_RUNTIME",
      workletRuntimeValue);

  std::shared_ptr<ErrorHandler> errorHandler =
      std::make_shared<AndroidErrorHandler>(scheduler_);

  // Layout Animations Start

  auto notifyAboutProgress = [=](int tag, jsi::Value progress) {
    this->layoutAnimations->cthis()->notifyAboutProgress(progress, tag);
  };

  auto notifyAboutEnd = [=](int tag, bool isCancelled) {
    this->layoutAnimations->cthis()->notifyAboutEnd(tag, (isCancelled) ? 1 : 0);
  };

  auto configurePropsFunction = [=](jsi::Runtime &rt,
                                    const jsi::Value &uiProps,
                                    const jsi::Value &nativeProps) {
    this->configureProps(rt, uiProps, nativeProps);
  };

  std::shared_ptr<LayoutAnimationsProxy> layoutAnimationsProxy =
      std::make_shared<LayoutAnimationsProxy>(
          notifyAboutProgress, notifyAboutEnd);
  std::weak_ptr<jsi::Runtime> wrt = animatedRuntime;
  layoutAnimations->cthis()->setWeakUIRuntime(wrt);

  // Layout Animations End

  PlatformDepMethodsHolder platformDepMethodsHolder = {
      requestRender,
      propUpdater,
      scrollToFunction,
      measuringFunction,
      getCurrentTime,
      registerSensorFunction,
      unregisterSensorFunction,
      setGestureStateFunction,
      configurePropsFunction};

  auto module = std::make_shared<NativeReanimatedModule>(
      jsCallInvoker_,
      scheduler_,
      animatedRuntime,
      errorHandler,
      propObtainer,
      layoutAnimationsProxy,
      platformDepMethodsHolder);

  _nativeReanimatedModule = module;
  std::weak_ptr<NativeReanimatedModule> weakModule = module;
  this->registerEventHandler(
      [weakModule, getCurrentTime](
          std::string eventName, std::string eventAsString) {
        if (auto module = weakModule.lock()) {
          jsi::Object global = module->runtime->global();
          jsi::String eventTimestampName =
              jsi::String::createFromAscii(*module->runtime, "_eventTimestamp");
          global.setProperty(
              *module->runtime, eventTimestampName, getCurrentTime());
          module->onEvent(eventName, eventAsString);
          global.setProperty(
              *module->runtime, eventTimestampName, jsi::Value::undefined());
        }
      });

  runtime_->global().setProperty(
      *runtime_,
      jsi::PropNameID::forAscii(*runtime_, "__reanimatedModuleProxy"),
      jsi::Object::createFromHostObject(*runtime_, module));
}

bool NativeProxy::isAnyHandlerWaitingForEvent(std::string s) {
  return _nativeReanimatedModule->isAnyHandlerWaitingForEvent(s);
}

void NativeProxy::registerNatives() {
  registerHybrid(
      {makeNativeMethod("initHybrid", NativeProxy::initHybrid),
       makeNativeMethod("installJSIBindings", NativeProxy::installJSIBindings),
       makeNativeMethod(
           "isAnyHandlerWaitingForEvent",
           NativeProxy::isAnyHandlerWaitingForEvent)});
}

void NativeProxy::requestRender(std::function<void(double)> onRender) {
  static auto method =
      javaPart_->getClass()
          ->getMethod<void(AnimationFrameCallback::javaobject)>(
              "requestRender");
  method(
      javaPart_.get(),
      AnimationFrameCallback::newObjectCxxArgs(std::move(onRender)).get());
}

void NativeProxy::registerEventHandler(
    std::function<void(std::string, std::string)> handler) {
  static auto method =
      javaPart_->getClass()->getMethod<void(EventHandler::javaobject)>(
          "registerEventHandler");
  method(
      javaPart_.get(),
      EventHandler::newObjectCxxArgs(std::move(handler)).get());
}

void NativeProxy::updateProps(
    jsi::Runtime &rt,
    int viewTag,
    const jsi::Object &props) {
  auto method = javaPart_->getClass()
                    ->getMethod<void(int, JMap<JString, JObject>::javaobject)>(
                        "updateProps");
  method(
      javaPart_.get(), viewTag, JNIHelper::ConvertToPropsMap(rt, props).get());
}

void NativeProxy::scrollTo(int viewTag, double x, double y, bool animated) {
  auto method =
      javaPart_->getClass()->getMethod<void(int, double, double, bool)>(
          "scrollTo");
  method(javaPart_.get(), viewTag, x, y, animated);
}

std::vector<std::pair<std::string, double>> NativeProxy::measure(int viewTag) {
  auto method =
      javaPart_->getClass()->getMethod<local_ref<JArrayFloat>(int)>("measure");
  local_ref<JArrayFloat> output = method(javaPart_.get(), viewTag);
  size_t size = output->size();
  auto elements = output->getRegion(0, size);
  std::vector<std::pair<std::string, double>> result;

  result.push_back({"x", elements[0]});
  result.push_back({"y", elements[1]});

  result.push_back({"pageX", elements[2]});
  result.push_back({"pageY", elements[3]});

  result.push_back({"width", elements[4]});
  result.push_back({"height", elements[5]});

  return result;
}

int NativeProxy::registerSensor(
    int sensorType,
    int interval,
    std::function<void(double[])> setter) {
  static auto method =
      javaPart_->getClass()->getMethod<int(int, int, SensorSetter::javaobject)>(
          "registerSensor");
  return method(
      javaPart_.get(),
      sensorType,
      interval,
      SensorSetter::newObjectCxxArgs(std::move(setter)).get());
}
void NativeProxy::unregisterSensor(int sensorId) {
  auto method = javaPart_->getClass()->getMethod<void(int)>("unregisterSensor");
  method(javaPart_.get(), sensorId);
}

void NativeProxy::setGestureState(int handlerTag, int newState) {
  auto method =
      javaPart_->getClass()->getMethod<void(int, int)>("setGestureState");
  method(javaPart_.get(), handlerTag, newState);
}

void NativeProxy::configureProps(
    jsi::Runtime &rt,
    const jsi::Value &uiProps,
    const jsi::Value &nativeProps) {
  auto method = javaPart_->getClass()
                    ->getMethod<void(
                        ReadableNativeArray::javaobject,
                        ReadableNativeArray::javaobject)>("configureProps");
  method(
      javaPart_.get(),
      ReadableNativeArray::newObjectCxxArgs(
          std::move(jsi::dynamicFromValue(rt, uiProps)))
          .get(),
      ReadableNativeArray::newObjectCxxArgs(
          std::move(jsi::dynamicFromValue(rt, nativeProps)))
          .get());
}

} // namespace reanimated
