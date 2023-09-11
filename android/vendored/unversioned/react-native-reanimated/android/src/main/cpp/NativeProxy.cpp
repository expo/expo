#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/ReadableNativeMap.h>

#include <memory>
#include <string>

#include "AndroidErrorHandler.h"
#include "AndroidScheduler.h"
#include "JsiUtils.h"
#include "LayoutAnimationsManager.h"
#include "NativeProxy.h"
#include "PlatformDepMethodsHolder.h"
#include "ReanimatedRuntime.h"
#include "ReanimatedVersion.h"

#ifdef RCT_NEW_ARCH_ENABLED
#include "FabricUtils.h"
#include "NewestShadowNodesRegistry.h"
#include "ReanimatedUIManagerBinding.h"
#endif

namespace reanimated {

using namespace facebook;
using namespace react;

NativeProxy::NativeProxy(
    jni::alias_ref<NativeProxy::javaobject> jThis,
    jsi::Runtime *rt,
    std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker,
    std::shared_ptr<Scheduler> scheduler,
    jni::global_ref<LayoutAnimations::javaobject> _layoutAnimations
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
        fabricUIManager
#endif
    )
    : javaPart_(jni::make_global(jThis)),
      runtime_(rt),
      jsCallInvoker_(jsCallInvoker),
      layoutAnimations_(std::move(_layoutAnimations)),
      scheduler_(scheduler)
#ifdef RCT_NEW_ARCH_ENABLED
      ,
      newestShadowNodesRegistry_(std::make_shared<NewestShadowNodesRegistry>())
#endif
{
#ifdef RCT_NEW_ARCH_ENABLED
  Binding *binding = fabricUIManager->getBinding();
  RuntimeExecutor runtimeExecutor = getRuntimeExecutorFromBinding(binding);
  std::shared_ptr<UIManager> uiManager =
      binding->getScheduler()->getUIManager();
  ReanimatedUIManagerBinding::createAndInstallIfNeeded(
      *rt, runtimeExecutor, uiManager, newestShadowNodesRegistry_);
#endif
}

NativeProxy::~NativeProxy() {
  // removed temporary, new event listener mechanism need fix on the RN side
  // reactScheduler_->removeEventListener(eventListener_);

  // cleanup all animated sensors here, since NativeProxy
  // has already been destroyed when AnimatedSensorModule's
  // destructor is ran
  nativeReanimatedModule_->cleanupSensors();
}

jni::local_ref<NativeProxy::jhybriddata> NativeProxy::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<facebook::react::CallInvokerHolder::javaobject>
        jsCallInvokerHolder,
    jni::alias_ref<AndroidScheduler::javaobject> androidScheduler,
    jni::alias_ref<LayoutAnimations::javaobject> layoutAnimations
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
        fabricUIManager
#endif
) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto scheduler = androidScheduler->cthis()->getScheduler();
  scheduler->setJSCallInvoker(jsCallInvoker);
  return makeCxxInstance(
      jThis,
      (jsi::Runtime *)jsContext,
      jsCallInvoker,
      scheduler,
      make_global(layoutAnimations)
#ifdef RCT_NEW_ARCH_ENABLED
          ,
      fabricUIManager
#endif
      /**/);
}

void NativeProxy::installJSIBindings(
    jni::alias_ref<JavaMessageQueueThread::javaobject> messageQueueThread
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
        fabricUIManager
#endif
    /**/) {
  auto jsQueue = std::make_shared<JMessageQueueThread>(messageQueueThread);
  std::shared_ptr<jsi::Runtime> animatedRuntime =
      ReanimatedRuntime::make(runtime_, jsQueue);

  std::shared_ptr<ErrorHandler> errorHandler =
      std::make_shared<AndroidErrorHandler>(scheduler_);

  auto module = std::make_shared<NativeReanimatedModule>(
      jsCallInvoker_,
      scheduler_,
      animatedRuntime,
      errorHandler,
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
      bindThis(&NativeProxy::obtainProp),
#endif
      getPlatformDependentMethods());

  scheduler_->setRuntimeManager(module);
  nativeReanimatedModule_ = module;

#ifdef RCT_NEW_ARCH_ENABLED
  Binding *binding = fabricUIManager->getBinding();
  std::shared_ptr<UIManager> uiManager =
      binding->getScheduler()->getUIManager();
  module->setUIManager(uiManager);
  module->setNewestShadowNodesRegistry(newestShadowNodesRegistry_);
  newestShadowNodesRegistry_ = nullptr;
//  removed temporary, new event listener mechanism need fix on the RN side
//  eventListener_ = std::make_shared<EventListener>(
//      [module, getCurrentTime](const RawEvent &rawEvent) {
//        return module->handleRawEvent(rawEvent, getCurrentTime());
//      });
//  reactScheduler_ = binding->getScheduler();
//  reactScheduler_->addEventListener(eventListener_);
#endif

  auto &rt = *runtime_;
  setGlobalProperties(rt, animatedRuntime);
  registerEventHandler();
  setupLayoutAnimations();

  rt.global().setProperty(
      rt,
      jsi::PropNameID::forAscii(rt, "__reanimatedModuleProxy"),
      jsi::Object::createFromHostObject(rt, module));
}

bool NativeProxy::isAnyHandlerWaitingForEvent(std::string s) {
  return nativeReanimatedModule_->isAnyHandlerWaitingForEvent(s);
}

void NativeProxy::performOperations() {
#ifdef RCT_NEW_ARCH_ENABLED
  nativeReanimatedModule_->performOperations();
#endif
}

void NativeProxy::registerNatives() {
  registerHybrid(
      {makeNativeMethod("initHybrid", NativeProxy::initHybrid),
       makeNativeMethod("installJSIBindings", NativeProxy::installJSIBindings),
       makeNativeMethod(
           "isAnyHandlerWaitingForEvent",
           NativeProxy::isAnyHandlerWaitingForEvent),
       makeNativeMethod("performOperations", NativeProxy::performOperations)});
}

void NativeProxy::requestRender(
    std::function<void(double)> onRender,
    jsi::Runtime &rt) {
  static const auto method =
      getJniMethod<void(AnimationFrameCallback::javaobject)>("requestRender");
  method(
      javaPart_.get(),
      AnimationFrameCallback::newObjectCxxArgs(std::move(onRender)).get());
}

void NativeProxy::registerEventHandler() {
  auto eventHandler = bindThis(&NativeProxy::handleEvent);
  static const auto method =
      getJniMethod<void(EventHandler::javaobject)>("registerEventHandler");
  method(
      javaPart_.get(),
      EventHandler::newObjectCxxArgs(std::move(eventHandler)).get());
}

void NativeProxy::maybeFlushUIUpdatesQueue() {
  static const auto method = getJniMethod<void()>("maybeFlushUIUpdatesQueue");
  method(javaPart_.get());
}

#ifdef RCT_NEW_ARCH_ENABLED
// nothing
#else
jsi::Value NativeProxy::obtainProp(
    jsi::Runtime &rt,
    const int viewTag,
    const jsi::String &propName) {
  static const auto method =
      getJniMethod<jni::local_ref<JString>(int, jni::local_ref<JString>)>(
          "obtainProp");
  local_ref<JString> propNameJStr =
      jni::make_jstring(propName.utf8(rt).c_str());
  auto result = method(javaPart_.get(), viewTag, propNameJStr);
  std::string str = result->toStdString();
  return jsi::Value(rt, jsi::String::createFromAscii(rt, str));
}

void NativeProxy::configureProps(
    jsi::Runtime &rt,
    const jsi::Value &uiProps,
    const jsi::Value &nativeProps) {
  static const auto method = getJniMethod<void(
      ReadableNativeArray::javaobject, ReadableNativeArray::javaobject)>(
      "configureProps");
  method(
      javaPart_.get(),
      ReadableNativeArray::newObjectCxxArgs(jsi::dynamicFromValue(rt, uiProps))
          .get(),
      ReadableNativeArray::newObjectCxxArgs(
          jsi::dynamicFromValue(rt, nativeProps))
          .get());
}

void NativeProxy::updateProps(
    jsi::Runtime &rt,
    int viewTag,
    const jsi::Value &viewName,
    const jsi::Object &props) {
  static const auto method =
      getJniMethod<void(int, JMap<JString, JObject>::javaobject)>(
          "updateProps");
  method(
      javaPart_.get(), viewTag, JNIHelper::ConvertToPropsMap(rt, props).get());
}

void NativeProxy::scrollTo(int viewTag, double x, double y, bool animated) {
  static const auto method =
      getJniMethod<void(int, double, double, bool)>("scrollTo");
  method(javaPart_.get(), viewTag, x, y, animated);
}

std::vector<std::pair<std::string, double>> NativeProxy::measure(int viewTag) {
  static const auto method =
      getJniMethod<local_ref<JArrayFloat>(int)>("measure");
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
#endif // RCT_NEW_ARCH_ENABLED

#ifdef RCT_NEW_ARCH_ENABLED
inline jni::local_ref<ReadableMap::javaobject> castReadableMap(
    jni::local_ref<ReadableNativeMap::javaobject> const &nativeMap) {
  return make_local(reinterpret_cast<ReadableMap::javaobject>(nativeMap.get()));
}

void NativeProxy::synchronouslyUpdateUIProps(
    jsi::Runtime &rt,
    Tag tag,
    const jsi::Value &props) {
  static const auto method =
      getJniMethod<void(int, jni::local_ref<ReadableMap::javaobject>)>(
          "synchronouslyUpdateUIProps");
  jni::local_ref<ReadableMap::javaobject> uiProps = castReadableMap(
      ReadableNativeMap::newObjectCxxArgs(jsi::dynamicFromValue(rt, props)));
  method(javaPart_.get(), tag, uiProps);
}
#endif

int NativeProxy::registerSensor(
    int sensorType,
    int interval,
    int iosReferenceFrame,
    std::function<void(double[], int)> setter) {
  static const auto method =
      getJniMethod<int(int, int, SensorSetter::javaobject)>("registerSensor");
  return method(
      javaPart_.get(),
      sensorType,
      interval,
      SensorSetter::newObjectCxxArgs(std::move(setter)).get());
}
void NativeProxy::unregisterSensor(int sensorId) {
  static const auto method = getJniMethod<void(int)>("unregisterSensor");
  method(javaPart_.get(), sensorId);
}

void NativeProxy::setGestureState(int handlerTag, int newState) {
  static const auto method = getJniMethod<void(int, int)>("setGestureState");
  method(javaPart_.get(), handlerTag, newState);
}

int NativeProxy::subscribeForKeyboardEvents(
    std::function<void(int, int)> keyboardEventDataUpdater,
    bool isStatusBarTranslucent) {
  static const auto method =
      getJniMethod<int(KeyboardEventDataUpdater::javaobject, bool)>(
          "subscribeForKeyboardEvents");
  return method(
      javaPart_.get(),
      KeyboardEventDataUpdater::newObjectCxxArgs(
          std::move(keyboardEventDataUpdater))
          .get(),
      isStatusBarTranslucent);
}

void NativeProxy::unsubscribeFromKeyboardEvents(int listenerId) {
  static const auto method =
      getJniMethod<void(int)>("unsubscribeFromKeyboardEvents");
  method(javaPart_.get(), listenerId);
}

double NativeProxy::getCurrentTime() {
  static const auto method = getJniMethod<jlong()>("getCurrentTime");
  jlong output = method(javaPart_.get());
  return static_cast<double>(output);
}

void NativeProxy::handleEvent(
    jni::alias_ref<JString> eventKey,
    jni::alias_ref<react::WritableMap> event) {
  // handles RCTEvents from RNGestureHandler
  auto eventName = eventKey->toString();

  // TODO: convert event directly to jsi::Value without JSON serialization
  std::string eventAsString;
  try {
    eventAsString = event->toString();
  } catch (std::exception &) {
    // Events from other libraries may contain NaN or INF values which
    // cannot be represented in JSON. See
    // https://github.com/software-mansion/react-native-reanimated/issues/1776
    // for details.
    return;
  }
#if REACT_NATIVE_MINOR_VERSION >= 72
  std::string eventJSON = eventAsString;
#else
  // remove "{ NativeMap: " and " }"
  std::string eventJSON = eventAsString.substr(13, eventAsString.length() - 15);
#endif
  if (eventJSON == "null") {
    return;
  }

  jsi::Runtime &rt = *nativeReanimatedModule_->runtime;
  jsi::Value payload;
  try {
    payload = jsi::Value::createFromJsonUtf8(
        rt, reinterpret_cast<uint8_t *>(&eventJSON[0]), eventJSON.size());
  } catch (std::exception &) {
    // Ignore events with malformed JSON payload.
    return;
  }

  nativeReanimatedModule_->handleEvent(
      eventName, payload, this->getCurrentTime());
}

void NativeProxy::progressLayoutAnimation(
    int tag,
    const jsi::Object &newProps,
    bool isSharedTransition) {
  auto &rt = *nativeReanimatedModule_->runtime;
  auto newPropsJNI = JNIHelper::ConvertToPropsMap(rt, newProps);
  layoutAnimations_->cthis()->progressLayoutAnimation(
      tag, newPropsJNI, isSharedTransition);
}

PlatformDepMethodsHolder NativeProxy::getPlatformDependentMethods() {
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
  auto updatePropsFunction = bindThis(&NativeProxy::updateProps);

  auto measureFunction = bindThis(&NativeProxy::measure);

  auto scrollToFunction = bindThis(&NativeProxy::scrollTo);
#endif

  auto getCurrentTime = bindThis(&NativeProxy::getCurrentTime);

  auto requestRender = bindThis(&NativeProxy::requestRender);

#ifdef RCT_NEW_ARCH_ENABLED
  auto synchronouslyUpdateUIPropsFunction =
      bindThis(&NativeProxy::synchronouslyUpdateUIProps);
#else
  auto configurePropsFunction = bindThis(&NativeProxy::configureProps);
#endif

  auto registerSensorFunction = bindThis(&NativeProxy::registerSensor);
  auto unregisterSensorFunction = bindThis(&NativeProxy::unregisterSensor);

  auto setGestureStateFunction = bindThis(&NativeProxy::setGestureState);

  auto subscribeForKeyboardEventsFunction =
      bindThis(&NativeProxy::subscribeForKeyboardEvents);

  auto unsubscribeFromKeyboardEventsFunction =
      bindThis(&NativeProxy::unsubscribeFromKeyboardEvents);

  auto progressLayoutAnimation =
      bindThis(&NativeProxy::progressLayoutAnimation);

  auto endLayoutAnimation = [this](int tag, bool isCancelled, bool removeView) {
    this->layoutAnimations_->cthis()->endLayoutAnimation(
        tag, isCancelled, removeView);
  };

  auto maybeFlushUiUpdatesQueueFunction =
      bindThis(&NativeProxy::maybeFlushUIUpdatesQueue);

  return {
      requestRender,
#ifdef RCT_NEW_ARCH_ENABLED
      synchronouslyUpdateUIPropsFunction,
#else
      updatePropsFunction,
      scrollToFunction,
      measureFunction,
      configurePropsFunction,
#endif
      getCurrentTime,
      progressLayoutAnimation,
      endLayoutAnimation,
      registerSensorFunction,
      unregisterSensorFunction,
      setGestureStateFunction,
      subscribeForKeyboardEventsFunction,
      unsubscribeFromKeyboardEventsFunction,
      maybeFlushUiUpdatesQueueFunction,
  };
}

void NativeProxy::setGlobalProperties(
    jsi::Runtime &jsRuntime,
    const std::shared_ptr<jsi::Runtime> &reanimatedRuntime) {
  auto workletRuntimeValue =
      jsRuntime.global()
          .getPropertyAsObject(jsRuntime, "ArrayBuffer")
          .asFunction(jsRuntime)
          .callAsConstructor(jsRuntime, {static_cast<double>(sizeof(void *))});
  uintptr_t *workletRuntimeData = reinterpret_cast<uintptr_t *>(
      workletRuntimeValue.getObject(jsRuntime).getArrayBuffer(jsRuntime).data(
          jsRuntime));
  workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedRuntime.get());

  jsRuntime.global().setProperty(
      jsRuntime, "_WORKLET_RUNTIME", workletRuntimeValue);

  jsRuntime.global().setProperty(jsRuntime, "_WORKLET", false);

#ifdef RCT_NEW_ARCH_ENABLED
  jsRuntime.global().setProperty(jsRuntime, "_IS_FABRIC", true);
#else
  jsRuntime.global().setProperty(jsRuntime, "_IS_FABRIC", false);
#endif

  auto version = getReanimatedVersionString(jsRuntime);
  jsRuntime.global().setProperty(jsRuntime, "_REANIMATED_VERSION_CPP", version);
}

void NativeProxy::setupLayoutAnimations() {
  auto weakModule =
      std::weak_ptr<NativeReanimatedModule>(nativeReanimatedModule_);

  layoutAnimations_->cthis()->setAnimationStartingBlock(
      [weakModule](
          int tag, int type, alias_ref<JMap<jstring, jstring>> values) {
        auto module = weakModule.lock();
        if (module == nullptr) {
          return;
        }
        auto &rt = *module->runtime;
        auto errorHandler = module->errorHandler;

        jsi::Object yogaValues(rt);
        for (const auto &entry : *values) {
          try {
            std::string keyString = entry.first->toStdString();
            std::string valueString = entry.second->toStdString();
            auto key = jsi::String::createFromAscii(rt, keyString);
            if (keyString == "currentTransformMatrix" ||
                keyString == "targetTransformMatrix") {
              jsi::Array matrix =
                  jsi_utils::convertStringToArray(rt, valueString, 9);
              yogaValues.setProperty(rt, key, matrix);
            } else {
              auto value = stod(valueString);
              yogaValues.setProperty(rt, key, value);
            }
          } catch (std::invalid_argument e) {
            errorHandler->setError("Failed to convert value to number");
            errorHandler->raise();
          }
        }

        module->layoutAnimationsManager().startLayoutAnimation(
            rt, tag, static_cast<LayoutAnimationType>(type), yogaValues);
      });

  layoutAnimations_->cthis()->setHasAnimationBlock(
      [weakModule](int tag, int type) {
        auto module = weakModule.lock();
        if (module == nullptr) {
          return false;
        }

        return module->layoutAnimationsManager().hasLayoutAnimation(
            tag, static_cast<LayoutAnimationType>(type));
      });

  layoutAnimations_->cthis()->setClearAnimationConfigBlock(
      [weakModule](int tag) {
        auto module = weakModule.lock();
        if (module == nullptr) {
          return;
        }

        module->layoutAnimationsManager().clearLayoutAnimationConfig(tag);
      });

  layoutAnimations_->cthis()->setCancelAnimationForTag(
      [weakModule](int tag, int type, jboolean cancelled, jboolean removeView) {
        if (auto module = weakModule.lock()) {
          jsi::Runtime &rt = *module->runtime;
          module->layoutAnimationsManager().cancelLayoutAnimation(
              rt,
              tag,
              static_cast<LayoutAnimationType>(type),
              cancelled,
              removeView);
        }
      });

  layoutAnimations_->cthis()->setFindPrecedingViewTagForTransition(
      [weakModule](int tag) {
        if (auto module = weakModule.lock()) {
          return module->layoutAnimationsManager()
              .findPrecedingViewTagForTransition(tag);
        } else {
          return -1;
        }
      });
}

} // namespace reanimated
