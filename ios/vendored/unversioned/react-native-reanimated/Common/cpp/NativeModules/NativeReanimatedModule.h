#pragma once

#ifdef RCT_NEW_ARCH_ENABLED
#include <react/renderer/uimanager/UIManager.h>
#endif

#include <memory>
#include <string>
#include <unordered_set>
#include <utility>
#include <vector>

#include "AnimatedSensorModule.h"
#include "EventHandlerRegistry.h"
#include "JSScheduler.h"
#include "LayoutAnimationsManager.h"
#include "NativeReanimatedModuleSpec.h"
#include "PlatformDepMethodsHolder.h"
#include "SingleInstanceChecker.h"
#include "UIScheduler.h"

#ifdef RCT_NEW_ARCH_ENABLED
#include "PropsRegistry.h"
#include "ReanimatedCommitHook.h"
#if REACT_NATIVE_MINOR_VERSION >= 73
#include "ReanimatedMountHook.h"
#endif
#endif

namespace reanimated {

class NativeReanimatedModule : public NativeReanimatedModuleSpec {
 public:
  NativeReanimatedModule(
      jsi::Runtime &rnRuntime,
      const std::shared_ptr<CallInvoker> &jsInvoker,
      const std::shared_ptr<MessageQueueThread> &jsQueue,
      const std::shared_ptr<UIScheduler> &uiScheduler,
      const PlatformDepMethodsHolder &platformDepMethodsHolder);

  ~NativeReanimatedModule();

  void installValueUnpacker(
      jsi::Runtime &rt,
      const jsi::Value &valueUnpackerCode) override;

  jsi::Value makeShareableClone(
      jsi::Runtime &rt,
      const jsi::Value &value,
      const jsi::Value &shouldRetainRemote) override;

  jsi::Value makeSynchronizedDataHolder(
      jsi::Runtime &rt,
      const jsi::Value &initialShareable) override;
  jsi::Value getDataSynchronously(
      jsi::Runtime &rt,
      const jsi::Value &synchronizedDataHolderRef) override;
  void updateDataSynchronously(
      jsi::Runtime &rt,
      const jsi::Value &synchronizedDataHolderRef,
      const jsi::Value &newData);

  void scheduleOnUI(jsi::Runtime &rt, const jsi::Value &worklet) override;

  jsi::Value createWorkletRuntime(
      jsi::Runtime &rt,
      const jsi::Value &name,
      const jsi::Value &initializer) override;
  jsi::Value scheduleOnRuntime(
      jsi::Runtime &rt,
      const jsi::Value &workletRuntimeValue,
      const jsi::Value &shareableWorkletValue) override;

  jsi::Value registerEventHandler(
      jsi::Runtime &rt,
      const jsi::Value &worklet,
      const jsi::Value &eventName,
      const jsi::Value &emitterReactTag) override;
  void unregisterEventHandler(
      jsi::Runtime &rt,
      const jsi::Value &registrationId) override;

  jsi::Value getViewProp(
      jsi::Runtime &rt,
      const jsi::Value &viewTag,
      const jsi::Value &propName,
      const jsi::Value &callback) override;

  jsi::Value enableLayoutAnimations(jsi::Runtime &rt, const jsi::Value &config)
      override;
  jsi::Value configureProps(
      jsi::Runtime &rt,
      const jsi::Value &uiProps,
      const jsi::Value &nativeProps) override;
  jsi::Value configureLayoutAnimation(
      jsi::Runtime &rt,
      const jsi::Value &viewTag,
      const jsi::Value &type,
      const jsi::Value &sharedTransitionTag,
      const jsi::Value &config) override;
  void setShouldAnimateExiting(
      jsi::Runtime &rt,
      const jsi::Value &viewTag,
      const jsi::Value &shouldAnimate) override;

  void onRender(double timestampMs);

  bool isAnyHandlerWaitingForEvent(
      const std::string &eventName,
      const int emitterReactTag);

  void maybeRequestRender();

  bool handleEvent(
      const std::string &eventName,
      const int emitterReactTag,
      const jsi::Value &payload,
      double currentTime);

  inline std::shared_ptr<JSLogger> getJSLogger() const {
    return jsLogger_;
  }

#ifdef RCT_NEW_ARCH_ENABLED
  bool handleRawEvent(const RawEvent &rawEvent, double currentTime);

  void updateProps(jsi::Runtime &rt, const jsi::Value &operations);

  void removeFromPropsRegistry(jsi::Runtime &rt, const jsi::Value &viewTags);

  void performOperations();

  void dispatchCommand(
      jsi::Runtime &rt,
      const jsi::Value &shadowNodeValue,
      const jsi::Value &commandNameValue,
      const jsi::Value &argsValue);

  jsi::Value measure(jsi::Runtime &rt, const jsi::Value &shadowNodeValue);

  void initializeFabric(const std::shared_ptr<UIManager> &uiManager);
#endif

  jsi::Value registerSensor(
      jsi::Runtime &rt,
      const jsi::Value &sensorType,
      const jsi::Value &interval,
      const jsi::Value &iosReferenceFrame,
      const jsi::Value &sensorDataContainer) override;
  void unregisterSensor(jsi::Runtime &rt, const jsi::Value &sensorId) override;

  void cleanupSensors();

  jsi::Value subscribeForKeyboardEvents(
      jsi::Runtime &rt,
      const jsi::Value &keyboardEventContainer,
      const jsi::Value &isStatusBarTranslucent) override;
  void unsubscribeFromKeyboardEvents(
      jsi::Runtime &rt,
      const jsi::Value &listenerId) override;

  inline LayoutAnimationsManager &layoutAnimationsManager() {
    return layoutAnimationsManager_;
  }

  inline jsi::Runtime &getUIRuntime() {
    return uiWorkletRuntime_->getJSIRuntime();
  }

 private:
  void requestAnimationFrame(jsi::Runtime &rt, const jsi::Value &callback);

#ifdef RCT_NEW_ARCH_ENABLED
  bool isThereAnyLayoutProp(jsi::Runtime &rt, const jsi::Object &props);
  jsi::Value filterNonAnimatableProps(
      jsi::Runtime &rt,
      const jsi::Value &props);
#endif // RCT_NEW_ARCH_ENABLED

  const std::shared_ptr<MessageQueueThread> jsQueue_;
  const std::shared_ptr<JSScheduler> jsScheduler_;
  const std::shared_ptr<UIScheduler> uiScheduler_;
  std::shared_ptr<WorkletRuntime> uiWorkletRuntime_;
  std::string valueUnpackerCode_;

  std::unique_ptr<EventHandlerRegistry> eventHandlerRegistry_;
  const RequestRenderFunction requestRender_;
  std::vector<std::shared_ptr<jsi::Value>> frameCallbacks_;
  volatile bool renderRequested_{false};
  const std::function<void(const double)> onRenderCallback_;
  AnimatedSensorModule animatedSensorModule_;
  const std::shared_ptr<JSLogger> jsLogger_;
  LayoutAnimationsManager layoutAnimationsManager_;

#ifdef RCT_NEW_ARCH_ENABLED
  const SynchronouslyUpdateUIPropsFunction synchronouslyUpdateUIPropsFunction_;

  std::unordered_set<std::string> nativePropNames_; // filled by configureProps
  std::unordered_set<std::string>
      animatablePropNames_; // filled by configureProps
  std::shared_ptr<UIManager> uiManager_;

  // After app reload, surfaceId on iOS is still 1 but on Android it's 11.
  // We can store surfaceId of the most recent ShadowNode as a workaround.
  SurfaceId surfaceId_ = -1;

  std::vector<std::pair<ShadowNode::Shared, std::unique_ptr<jsi::Value>>>
      operationsInBatch_; // TODO: refactor std::pair to custom struct

  std::shared_ptr<PropsRegistry> propsRegistry_;
  std::shared_ptr<ReanimatedCommitHook> commitHook_;
#if REACT_NATIVE_MINOR_VERSION >= 73
  std::shared_ptr<ReanimatedMountHook> mountHook_;
#endif

  std::vector<Tag> tagsToRemove_; // from `propsRegistry_`
#else
  const ObtainPropFunction obtainPropFunction_;
  const ConfigurePropsFunction configurePropsPlatformFunction_;
  const UpdatePropsFunction updatePropsFunction_;
#endif

  const KeyboardEventSubscribeFunction subscribeForKeyboardEventsFunction_;
  const KeyboardEventUnsubscribeFunction unsubscribeFromKeyboardEventsFunction_;

#ifndef NDEBUG
  SingleInstanceChecker<NativeReanimatedModule> singleInstanceChecker_;
#endif
};

} // namespace reanimated
