#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/JMessageQueueThread.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/ReadableNativeMap.h>

#include <memory>
#include <string>

#include "AndroidUIScheduler.h"
#include "LayoutAnimationsManager.h"
#include "NativeProxy.h"
#include "PlatformDepMethodsHolder.h"
#include "RNRuntimeDecorator.h"
#include "ReanimatedJSIUtils.h"
#include "ReanimatedRuntime.h"
#include "WorkletRuntime.h"
#include "WorkletRuntimeCollector.h"

namespace reanimated {

using namespace facebook;
using namespace react;

NativeProxy::NativeProxy(
    jni::alias_ref<NativeProxy::javaobject> jThis,
    jsi::Runtime *rnRuntime,
    const std::shared_ptr<facebook::react::CallInvoker> &jsCallInvoker,
    const std::shared_ptr<UIScheduler> &uiScheduler,
    jni::global_ref<LayoutAnimations::javaobject> layoutAnimations,
    jni::alias_ref<JavaMessageQueueThread::javaobject> messageQueueThread
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
        fabricUIManager
#endif
    )
    : javaPart_(jni::make_global(jThis)),
      rnRuntime_(rnRuntime),
      nativeReanimatedModule_(std::make_shared<NativeReanimatedModule>(
          *rnRuntime,
          jsCallInvoker,
          std::make_shared<JMessageQueueThread>(messageQueueThread),
          uiScheduler,
          getPlatformDependentMethods())),
      layoutAnimations_(std::move(layoutAnimations)) {
#ifdef RCT_NEW_ARCH_ENABLED
  const auto &uiManager =
      fabricUIManager->getBinding()->getScheduler()->getUIManager();
  nativeReanimatedModule_->initializeFabric(uiManager);
  // removed temporarily, event listener mechanism needs to be fixed on RN side
  // eventListener_ = std::make_shared<EventListener>(
  //     [nativeReanimatedModule, getCurrentTime](const RawEvent &rawEvent) {
  //       return nativeReanimatedModule->handleRawEvent(
  //           rawEvent, getCurrentTime());
  //     });
  // reactScheduler_ = binding->getScheduler();
  // reactScheduler_->addEventListener(eventListener_);
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
    jni::alias_ref<AndroidUIScheduler::javaobject> androidUiScheduler,
    jni::alias_ref<LayoutAnimations::javaobject> layoutAnimations,
    jni::alias_ref<JavaMessageQueueThread::javaobject> messageQueueThread
#ifdef RCT_NEW_ARCH_ENABLED
    ,
    jni::alias_ref<facebook::react::JFabricUIManager::javaobject>
        fabricUIManager
#endif
) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto uiScheduler = androidUiScheduler->cthis()->getUIScheduler();
  return makeCxxInstance(
      jThis,
      (jsi::Runtime *)jsContext,
      jsCallInvoker,
      uiScheduler,
      make_global(layoutAnimations),
      messageQueueThread
#ifdef RCT_NEW_ARCH_ENABLED
      ,
      fabricUIManager
#endif
      /**/);
}

void NativeProxy::installJSIBindings() {
  jsi::Runtime &rnRuntime = *rnRuntime_;
  WorkletRuntimeCollector::install(rnRuntime);
  auto isReducedMotion = getIsReducedMotion();
  RNRuntimeDecorator::decorate(
      rnRuntime, nativeReanimatedModule_, isReducedMotion);

  registerEventHandler();
  setupLayoutAnimations();
}

bool NativeProxy::isAnyHandlerWaitingForEvent(
    const std::string &eventName,
    const int emitterReactTag) {
  return nativeReanimatedModule_->isAnyHandlerWaitingForEvent(
      eventName, emitterReactTag);
}

void NativeProxy::performOperations() {
#ifdef RCT_NEW_ARCH_ENABLED
  nativeReanimatedModule_->performOperations();
#endif
}

bool NativeProxy::getIsReducedMotion() {
  static const auto method = getJniMethod<jboolean()>("getIsReducedMotion");
  return method(javaPart_.get());
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
    jsi::Runtime &) {
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

void NativeProxy::updateProps(jsi::Runtime &rt, const jsi::Value &operations) {
  static const auto method =
      getJniMethod<void(int, JMap<JString, JObject>::javaobject)>(
          "updateProps");
  auto array = operations.asObject(rt).asArray(rt);
  size_t length = array.size(rt);
  for (size_t i = 0; i < length; ++i) {
    auto item = array.getValueAtIndex(rt, i).asObject(rt);
    int viewTag = item.getProperty(rt, "tag").asNumber();
    const jsi::Object &props = item.getProperty(rt, "updates").asObject(rt);
    method(
        javaPart_.get(),
        viewTag,
        JNIHelper::ConvertToPropsMap(rt, props).get());
  }
}

void NativeProxy::scrollTo(int viewTag, double x, double y, bool animated) {
  static const auto method =
      getJniMethod<void(int, double, double, bool)>("scrollTo");
  method(javaPart_.get(), viewTag, x, y, animated);
}

inline jni::local_ref<ReadableArray::javaobject> castReadableArray(
    jni::local_ref<ReadableNativeArray::javaobject> const &nativeArray) {
  return make_local(
      reinterpret_cast<ReadableArray::javaobject>(nativeArray.get()));
}

void NativeProxy::dispatchCommand(
    jsi::Runtime &rt,
    const int viewTag,
    const jsi::Value &commandNameValue,
    const jsi::Value &argsValue) {
  static const auto method = getJniMethod<void(
      int, jni::local_ref<JString>, jni::local_ref<ReadableArray::javaobject>)>(
      "dispatchCommand");
  local_ref<JString> commandId =
      jni::make_jstring(commandNameValue.asString(rt).utf8(rt).c_str());
  jni::local_ref<ReadableArray::javaobject> commandArgs =
      castReadableArray(ReadableNativeArray::newObjectCxxArgs(
          jsi::dynamicFromValue(rt, argsValue)));
  method(javaPart_.get(), viewTag, commandId, commandArgs);
}

std::vector<std::pair<std::string, double>> NativeProxy::measure(int viewTag) {
  static const auto method =
      getJniMethod<local_ref<JArrayFloat>(int)>("measure");
  local_ref<JArrayFloat> output = method(javaPart_.get(), viewTag);
  size_t size = output->size();
  auto elements = output->getRegion(0, size);

  return {
      {"x", elements[0]},
      {"y", elements[1]},
      {"pageX", elements[2]},
      {"pageY", elements[3]},
      {"width", elements[4]},
      {"height", elements[5]},
  };
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
    const jsi::Object &props) {
  static const auto method =
      getJniMethod<void(int, jni::local_ref<ReadableMap::javaobject>)>(
          "synchronouslyUpdateUIProps");
  jni::local_ref<ReadableMap::javaobject> uiProps =
      castReadableMap(ReadableNativeMap::newObjectCxxArgs(
          jsi::dynamicFromValue(rt, jsi::Value(rt, props))));
  method(javaPart_.get(), tag, uiProps);
}
#endif

int NativeProxy::registerSensor(
    int sensorType,
    int interval,
    int,
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
    jni::alias_ref<JString> eventName,
    jint emitterReactTag,
    jni::alias_ref<react::WritableMap> event) {
  // handles RCTEvents from RNGestureHandler
  if (event.get() == nullptr) {
    // Ignore events with null payload.
    return;
  }
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

  jsi::Runtime &rt = nativeReanimatedModule_->getUIRuntime();
  jsi::Value payload;
  try {
    payload = jsi::Value::createFromJsonUtf8(
        rt, reinterpret_cast<uint8_t *>(&eventJSON[0]), eventJSON.size());
  } catch (std::exception &) {
    // Ignore events with malformed JSON payload.
    return;
  }

  nativeReanimatedModule_->handleEvent(
      eventName->toString(), emitterReactTag, payload, this->getCurrentTime());
}

void NativeProxy::progressLayoutAnimation(
    jsi::Runtime &rt,
    int tag,
    const jsi::Object &newProps,
    bool isSharedTransition) {
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

  auto dispatchCommandFunction = bindThis(&NativeProxy::dispatchCommand);

  auto obtainPropFunction = bindThis(&NativeProxy::obtainProp);
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

  auto endLayoutAnimation = [this](int tag, bool removeView) {
    this->layoutAnimations_->cthis()->endLayoutAnimation(tag, removeView);
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
      dispatchCommandFunction,
      measureFunction,
      configurePropsFunction,
      obtainPropFunction,
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

void NativeProxy::setupLayoutAnimations() {
  auto weakNativeReanimatedModule =
      std::weak_ptr<NativeReanimatedModule>(nativeReanimatedModule_);

  layoutAnimations_->cthis()->setAnimationStartingBlock(
      [weakNativeReanimatedModule](
          int tag, int type, alias_ref<JMap<jstring, jstring>> values) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          jsi::Runtime &rt = nativeReanimatedModule->getUIRuntime();
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
              throw std::runtime_error(
                  "[Reanimated] Failed to convert value to number.");
            }
          }
          nativeReanimatedModule->layoutAnimationsManager()
              .startLayoutAnimation(
                  rt, tag, static_cast<LayoutAnimationType>(type), yogaValues);
        }
      });

  layoutAnimations_->cthis()->setHasAnimationBlock(
      [weakNativeReanimatedModule](int tag, int type) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          return nativeReanimatedModule->layoutAnimationsManager()
              .hasLayoutAnimation(tag, static_cast<LayoutAnimationType>(type));
        }
        return false;
      });

#ifdef DEBUG
  layoutAnimations_->cthis()->setCheckDuplicateSharedTag(
      [weakNativeReanimatedModule](int viewTag, int screenTag) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          nativeReanimatedModule->layoutAnimationsManager()
              .checkDuplicateSharedTag(viewTag, screenTag);
        }
      });
#endif

  layoutAnimations_->cthis()->setClearAnimationConfigBlock(
      [weakNativeReanimatedModule](int tag) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          nativeReanimatedModule->layoutAnimationsManager()
              .clearLayoutAnimationConfig(tag);
        }
      });

  layoutAnimations_->cthis()->setCancelAnimationForTag(
      [weakNativeReanimatedModule](int tag) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          jsi::Runtime &rt = nativeReanimatedModule->getUIRuntime();
          nativeReanimatedModule->layoutAnimationsManager()
              .cancelLayoutAnimation(rt, tag);
        }
      });

  layoutAnimations_->cthis()->setFindPrecedingViewTagForTransition(
      [weakNativeReanimatedModule](int tag) {
        if (auto nativeReanimatedModule = weakNativeReanimatedModule.lock()) {
          return nativeReanimatedModule->layoutAnimationsManager()
              .findPrecedingViewTagForTransition(tag);
        } else {
          return -1;
        }
      });
}

} // namespace reanimated
