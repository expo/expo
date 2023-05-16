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
      layoutAnimations(std::move(_layoutAnimations)),
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
  _nativeReanimatedModule->cleanupSensors();
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
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
  auto updatePropsFunction = [this](
                                 jsi::Runtime &rt,
                                 int viewTag,
                                 const jsi::Value &viewName,
                                 const jsi::Object &props) {
    // viewName is for iOS only, we skip it here
    this->updateProps(rt, viewTag, props);
  };

  auto measureFunction =
      [this](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag);
  };

  auto scrollToFunction =
      [this](int viewTag, double x, double y, bool animated) -> void {
    scrollTo(viewTag, x, y, animated);
  };
#endif

  auto getCurrentTime = [this]() {
    static const auto method =
        javaPart_->getClass()->getMethod<jlong()>("getCurrentTime");
    jlong output = method(javaPart_.get());
    return static_cast<double>(output);
  };

  auto requestRender = [this](
                           std::function<void(double)> onRender,
                           jsi::Runtime &rt) { this->requestRender(onRender); };

#ifdef RCT_NEW_ARCH_ENABLED
  auto synchronouslyUpdateUIPropsFunction =
      [this](jsi::Runtime &rt, Tag tag, const jsi::Value &props) {
        this->synchronouslyUpdateUIProps(rt, tag, props);
      };
#else
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

  auto configurePropsFunction = [=](jsi::Runtime &rt,
                                    const jsi::Value &uiProps,
                                    const jsi::Value &nativeProps) {
    this->configureProps(rt, uiProps, nativeProps);
  };
#endif

  auto registerSensorFunction =
      [this](
          int sensorType,
          int interval,
          int iosReferenceFrame,
          std::function<void(double[], int)> setter) -> int {
    return this->registerSensor(sensorType, interval, std::move(setter));
  };
  auto unregisterSensorFunction = [this](int sensorId) {
    unregisterSensor(sensorId);
  };

  auto setGestureStateFunction = [this](int handlerTag, int newState) -> void {
    setGestureState(handlerTag, newState);
  };

  auto subscribeForKeyboardEventsFunction =
      [this](
          std::function<void(int, int)> keyboardEventDataUpdater,
          bool isStatusBarTranslucent) -> int {
    return subscribeForKeyboardEvents(
        std::move(keyboardEventDataUpdater), isStatusBarTranslucent);
  };

  auto unsubscribeFromKeyboardEventsFunction = [this](int listenerId) -> void {
    unsubscribeFromKeyboardEvents(listenerId);
  };

  auto jsQueue = std::make_shared<JMessageQueueThread>(messageQueueThread);
  std::shared_ptr<jsi::Runtime> animatedRuntime =
      ReanimatedRuntime::make(runtime_, jsQueue);

  auto &rt = *runtime_;

  auto workletRuntimeValue =
      rt.global()
          .getPropertyAsObject(rt, "ArrayBuffer")
          .asFunction(rt)
          .callAsConstructor(rt, {static_cast<double>(sizeof(void *))});
  uintptr_t *workletRuntimeData = reinterpret_cast<uintptr_t *>(
      workletRuntimeValue.getObject(rt).getArrayBuffer(rt).data(rt));
  workletRuntimeData[0] = reinterpret_cast<uintptr_t>(animatedRuntime.get());

  rt.global().setProperty(rt, "_WORKLET_RUNTIME", workletRuntimeValue);

#ifdef RCT_NEW_ARCH_ENABLED
  rt.global().setProperty(rt, "_IS_FABRIC", true);
#else
  rt.global().setProperty(rt, "_IS_FABRIC", false);
#endif

  auto version = getReanimatedVersionString(rt);
  rt.global().setProperty(rt, "_REANIMATED_VERSION_CPP", version);

  std::shared_ptr<ErrorHandler> errorHandler =
      std::make_shared<AndroidErrorHandler>(scheduler_);
  std::weak_ptr<jsi::Runtime> wrt = animatedRuntime;

  auto progressLayoutAnimation =
      [this, wrt](
          int tag, const jsi::Object &newProps, bool isSharedTransition) {
        auto newPropsJNI = JNIHelper::ConvertToPropsMap(*wrt.lock(), newProps);
        this->layoutAnimations->cthis()->progressLayoutAnimation(
            tag, newPropsJNI, isSharedTransition);
      };

  auto endLayoutAnimation = [this](int tag, bool isCancelled, bool removeView) {
    this->layoutAnimations->cthis()->endLayoutAnimation(
        tag, isCancelled, removeView);
  };

  PlatformDepMethodsHolder platformDepMethodsHolder = {
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
  };

  auto module = std::make_shared<NativeReanimatedModule>(
      jsCallInvoker_,
      scheduler_,
      animatedRuntime,
      errorHandler,
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
      propObtainer,
#endif
      platformDepMethodsHolder);

  scheduler_->setRuntimeManager(module);

  _nativeReanimatedModule = module;
  std::weak_ptr<NativeReanimatedModule> weakModule = module;

  this->registerEventHandler([weakModule, getCurrentTime](
                                 jni::alias_ref<JString> eventKey,
                                 jni::alias_ref<react::WritableMap> event) {
    // handles RCTEvents from RNGestureHandler
    if (auto module = weakModule.lock()) {
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
      std::string eventJSON = eventAsString.substr(
          13, eventAsString.length() - 15); // removes "{ NativeMap: " and " }"
      if (eventJSON == "null") {
        return;
      }

      jsi::Runtime &rt = *module->runtime;
      jsi::Value payload;
      try {
        payload = jsi::Value::createFromJsonUtf8(
            rt, reinterpret_cast<uint8_t *>(&eventJSON[0]), eventJSON.size());
      } catch (std::exception &) {
        // Ignore events with malformed JSON payload.
        return;
      }

      module->handleEvent(eventName, payload, getCurrentTime());
    }
  });

#ifdef RCT_NEW_ARCH_ENABLED
  Binding *binding = fabricUIManager->getBinding();
  std::shared_ptr<UIManager> uiManager =
      binding->getScheduler()->getUIManager();
  module->setUIManager(uiManager);
  module->setNewestShadowNodesRegistry(newestShadowNodesRegistry_);
  newestShadowNodesRegistry_ = nullptr;
#endif
  //  removed temporary, new event listener mechanism need fix on the RN side
  //  eventListener_ = std::make_shared<EventListener>(
  //      [module, getCurrentTime](const RawEvent &rawEvent) {
  //        return module->handleRawEvent(rawEvent, getCurrentTime());
  //      });
  //  reactScheduler_ = binding->getScheduler();
  //  reactScheduler_->addEventListener(eventListener_);

  std::weak_ptr<ErrorHandler> weakErrorHandler = errorHandler;

  layoutAnimations->cthis()->setAnimationStartingBlock(
      [wrt, weakModule, weakErrorHandler](
          int tag, int type, alias_ref<JMap<jstring, jstring>> values) {
        auto &rt = *wrt.lock();
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
            if (auto errorHandler = weakErrorHandler.lock()) {
              errorHandler->setError("Failed to convert value to number");
              errorHandler->raise();
            }
          }
        }

        auto reaModule = weakModule.lock();
        if (reaModule == nullptr) {
          return;
        }

        reaModule->layoutAnimationsManager().startLayoutAnimation(
            rt, tag, static_cast<LayoutAnimationType>(type), yogaValues);
      });

  layoutAnimations->cthis()->setHasAnimationBlock(
      [weakModule](int tag, int type) {
        auto reaModule = weakModule.lock();
        if (reaModule == nullptr) {
          return false;
        }

        return reaModule->layoutAnimationsManager().hasLayoutAnimation(
            tag, static_cast<LayoutAnimationType>(type));
      });

  layoutAnimations->cthis()->setClearAnimationConfigBlock(
      [weakModule](int tag) {
        auto reaModule = weakModule.lock();
        if (reaModule == nullptr) {
          return;
        }

        reaModule->layoutAnimationsManager().clearLayoutAnimationConfig(tag);
      });

  layoutAnimations->cthis()->setCancelAnimationForTag(
      [wrt, weakModule](
          int tag, int type, jboolean cancelled, jboolean removeView) {
        if (auto reaModule = weakModule.lock()) {
          if (auto runtime = wrt.lock()) {
            jsi::Runtime &rt = *runtime;
            reaModule->layoutAnimationsManager().cancelLayoutAnimation(
                rt,
                tag,
                static_cast<LayoutAnimationType>(type),
                cancelled,
                removeView);
          }
        }
      });

  layoutAnimations->cthis()->setFindPrecedingViewTagForTransition(
      [weakModule](int tag) {
        if (auto module = weakModule.lock()) {
          return module->layoutAnimationsManager()
              .findPrecedingViewTagForTransition(tag);
        } else {
          return -1;
        }
      });

  rt.global().setProperty(
      rt,
      jsi::PropNameID::forAscii(rt, "__reanimatedModuleProxy"),
      jsi::Object::createFromHostObject(rt, module));
}

bool NativeProxy::isAnyHandlerWaitingForEvent(std::string s) {
  return _nativeReanimatedModule->isAnyHandlerWaitingForEvent(s);
}

void NativeProxy::performOperations() {
#ifdef RCT_NEW_ARCH_ENABLED
  _nativeReanimatedModule->performOperations();
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
    std::function<
        void(jni::alias_ref<JString>, jni::alias_ref<react::WritableMap>)>
        handler) {
  static auto method =
      javaPart_->getClass()->getMethod<void(EventHandler::javaobject)>(
          "registerEventHandler");
  method(
      javaPart_.get(),
      EventHandler::newObjectCxxArgs(std::move(handler)).get());
}

#ifdef RCT_NEW_ARCH_ENABLED
// nothing
#else
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
      javaPart_->getClass()
          ->getMethod<void(int, jni::local_ref<ReadableMap::javaobject>)>(
              "synchronouslyUpdateUIProps");
  jni::local_ref<ReadableMap::javaobject> uiProps = castReadableMap(
      ReadableNativeMap::newObjectCxxArgs(jsi::dynamicFromValue(rt, props)));
  method(javaPart_.get(), tag, uiProps);
}
#endif

int NativeProxy::registerSensor(
    int sensorType,
    int interval,
    std::function<void(double[], int)> setter) {
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
      ReadableNativeArray::newObjectCxxArgs(jsi::dynamicFromValue(rt, uiProps))
          .get(),
      ReadableNativeArray::newObjectCxxArgs(
          jsi::dynamicFromValue(rt, nativeProps))
          .get());
}

int NativeProxy::subscribeForKeyboardEvents(
    std::function<void(int, int)> keyboardEventDataUpdater,
    bool isStatusBarTranslucent) {
  auto method =
      javaPart_->getClass()
          ->getMethod<int(KeyboardEventDataUpdater::javaobject, bool)>(
              "subscribeForKeyboardEvents");
  return method(
      javaPart_.get(),
      KeyboardEventDataUpdater::newObjectCxxArgs(
          std::move(keyboardEventDataUpdater))
          .get(),
      isStatusBarTranslucent);
}

void NativeProxy::unsubscribeFromKeyboardEvents(int listenerId) {
  auto method = javaPart_->getClass()->getMethod<void(int)>(
      "unsubscribeFromKeyboardEvents");
  method(javaPart_.get(), listenerId);
}

} // namespace reanimated
