#include "NativeReanimatedModule.h"

#ifdef RCT_NEW_ARCH_ENABLED
#if REACT_NATIVE_MINOR_VERSION >= 72
#include <react/renderer/core/TraitCast.h>
#endif
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <react/renderer/uimanager/primitives.h>
#endif

#include <functional>
#include <memory>
#include <thread>
#include <unordered_map>

#ifdef RCT_NEW_ARCH_ENABLED
#include "FabricUtils.h"
#include "ReanimatedCommitMarker.h"
#include "ShadowTreeCloner.h"
#endif

#include "EventHandlerRegistry.h"
#include "FeaturesConfig.h"
#include "JSScheduler.h"
#include "ReanimatedHiddenHeaders.h"
#include "Shareables.h"
#include "UIRuntimeDecorator.h"
#include "WorkletEventHandler.h"

#ifdef __ANDROID__
#include <fbjni/fbjni.h>
#endif

#ifdef DEBUG
#include "JSLogger.h"
#endif

using namespace facebook;

namespace reanimated {

NativeReanimatedModule::NativeReanimatedModule(
    jsi::Runtime &rnRuntime,
    const std::shared_ptr<CallInvoker> &jsInvoker,
    const std::shared_ptr<MessageQueueThread> &jsQueue,
    const std::shared_ptr<UIScheduler> &uiScheduler,
    const PlatformDepMethodsHolder &platformDepMethodsHolder)
    : NativeReanimatedModuleSpec(jsInvoker),
      jsQueue_(jsQueue),
      jsScheduler_(std::make_shared<JSScheduler>(rnRuntime, jsInvoker)),
      uiScheduler_(uiScheduler),
      uiWorkletRuntime_(std::make_shared<WorkletRuntime>(
          rnRuntime,
          jsQueue,
          jsScheduler_,
          "Reanimated UI runtime")),
      eventHandlerRegistry_(std::make_unique<EventHandlerRegistry>()),
      requestRender_(platformDepMethodsHolder.requestRender),
      onRenderCallback_([this](const double timestampMs) {
        renderRequested_ = false;
        onRender(timestampMs);
      }),
      animatedSensorModule_(platformDepMethodsHolder),
#ifdef DEBUG
      layoutAnimationsManager_(std::make_shared<JSLogger>(jsScheduler_)),
#endif
#ifdef RCT_NEW_ARCH_ENABLED
      synchronouslyUpdateUIPropsFunction_(
          platformDepMethodsHolder.synchronouslyUpdateUIPropsFunction),
      propsRegistry_(std::make_shared<PropsRegistry>()),
#else
      obtainPropFunction_(platformDepMethodsHolder.obtainPropFunction),
      configurePropsPlatformFunction_(
          platformDepMethodsHolder.configurePropsFunction),
      updatePropsFunction_(platformDepMethodsHolder.updatePropsFunction),
#endif
      subscribeForKeyboardEventsFunction_(
          platformDepMethodsHolder.subscribeForKeyboardEvents),
      unsubscribeFromKeyboardEventsFunction_(
          platformDepMethodsHolder.unsubscribeFromKeyboardEvents) {
  auto requestAnimationFrame =
      [this](jsi::Runtime &rt, const jsi::Value &callback) {
        this->requestAnimationFrame(rt, callback);
      };

  auto updateDataSynchronously =
      [this](
          jsi::Runtime &rt,
          const jsi::Value &synchronizedDataHolderRef,
          const jsi::Value &newData) {
        return this->updateDataSynchronously(
            rt, synchronizedDataHolderRef, newData);
      };

#ifdef RCT_NEW_ARCH_ENABLED
  auto updateProps = [this](jsi::Runtime &rt, const jsi::Value &operations) {
    this->updateProps(rt, operations);
  };

  auto removeFromPropsRegistry =
      [this](jsi::Runtime &rt, const jsi::Value &viewTags) {
        this->removeFromPropsRegistry(rt, viewTags);
      };

  auto measure = [this](jsi::Runtime &rt, const jsi::Value &shadowNodeValue) {
    return this->measure(rt, shadowNodeValue);
  };

  auto dispatchCommand = [this](
                             jsi::Runtime &rt,
                             const jsi::Value &shadowNodeValue,
                             const jsi::Value &commandNameValue,
                             const jsi::Value &argsValue) {
    this->dispatchCommand(rt, shadowNodeValue, commandNameValue, argsValue);
  };
#endif

  jsi::Runtime &uiRuntime = uiWorkletRuntime_->getJSIRuntime();
  UIRuntimeDecorator::decorate(
      uiRuntime,
#ifdef RCT_NEW_ARCH_ENABLED
      removeFromPropsRegistry,
      updateProps,
      measure,
      dispatchCommand,
#else
      platformDepMethodsHolder.scrollToFunction,
      platformDepMethodsHolder.updatePropsFunction,
      platformDepMethodsHolder.measureFunction,
      platformDepMethodsHolder.dispatchCommandFunction,
#endif
      requestAnimationFrame,
      updateDataSynchronously,
      platformDepMethodsHolder.getCurrentTime,
      platformDepMethodsHolder.setGestureStateFunction,
      platformDepMethodsHolder.progressLayoutAnimation,
      platformDepMethodsHolder.endLayoutAnimation,
      platformDepMethodsHolder.maybeFlushUIUpdatesQueueFunction);
}

void NativeReanimatedModule::installValueUnpacker(
    jsi::Runtime &rt,
    const jsi::Value &valueUnpackerCode) {
  valueUnpackerCode_ = valueUnpackerCode.asString(rt).utf8(rt);
  uiWorkletRuntime_->installValueUnpacker(valueUnpackerCode_);
}

NativeReanimatedModule::~NativeReanimatedModule() {
  // event handler registry and frame callbacks store some JSI values from UI
  // runtime, so they have to go away before we tear down the runtime
  eventHandlerRegistry_.reset();
  frameCallbacks_.clear();
  uiWorkletRuntime_.reset();
}

void NativeReanimatedModule::scheduleOnUI(
    jsi::Runtime &rt,
    const jsi::Value &worklet) {
  auto shareableWorklet = extractShareableOrThrow<ShareableWorklet>(
      rt, worklet, "[Reanimated] Only worklets can be scheduled to run on UI.");
  uiScheduler_->scheduleOnUI([=] {
#if JS_RUNTIME_HERMES
    // JSI's scope defined here allows for JSI-objects to be cleared up after
    // each runtime loop. Within these loops we typically create some temporary
    // JSI objects and hence it allows for such objects to be garbage collected
    // much sooner.
    // Apparently the scope API is only supported on Hermes at the moment.
    const auto scope = jsi::Scope(uiWorkletRuntime_->getJSIRuntime());
#endif
    uiWorkletRuntime_->runGuarded(shareableWorklet);
  });
}

jsi::Value NativeReanimatedModule::createWorkletRuntime(
    jsi::Runtime &rt,
    const jsi::Value &name,
    const jsi::Value &initializer) {
  auto workletRuntime = std::make_shared<WorkletRuntime>(
      rt, jsQueue_, jsScheduler_, name.asString(rt).utf8(rt));
  workletRuntime->installValueUnpacker(valueUnpackerCode_);
  auto initializerShareable = extractShareableOrThrow<ShareableWorklet>(
      rt, initializer, "[Reanimated] Initializer must be a worklet.");
  workletRuntime->runGuarded(initializerShareable);
  return jsi::Object::createFromHostObject(rt, workletRuntime);
}

jsi::Value NativeReanimatedModule::makeSynchronizedDataHolder(
    jsi::Runtime &rt,
    const jsi::Value &initialShareable) {
  auto dataHolder =
      std::make_shared<ShareableSynchronizedDataHolder>(rt, initialShareable);
  return dataHolder->getJSValue(rt);
}

void NativeReanimatedModule::updateDataSynchronously(
    jsi::Runtime &rt,
    const jsi::Value &synchronizedDataHolderRef,
    const jsi::Value &newData) {
  auto dataHolder = extractShareableOrThrow<ShareableSynchronizedDataHolder>(
      rt, synchronizedDataHolderRef);
  dataHolder->set(rt, newData);
}

jsi::Value NativeReanimatedModule::getDataSynchronously(
    jsi::Runtime &rt,
    const jsi::Value &synchronizedDataHolderRef) {
  auto dataHolder = extractShareableOrThrow<ShareableSynchronizedDataHolder>(
      rt, synchronizedDataHolderRef);
  return dataHolder->get(rt);
}

jsi::Value NativeReanimatedModule::makeShareableClone(
    jsi::Runtime &rt,
    const jsi::Value &value,
    const jsi::Value &shouldRetainRemote) {
  return reanimated::makeShareableClone(rt, value, shouldRetainRemote);
}

jsi::Value NativeReanimatedModule::registerEventHandler(
    jsi::Runtime &rt,
    const jsi::Value &worklet,
    const jsi::Value &eventName,
    const jsi::Value &emitterReactTag) {
  static uint64_t NEXT_EVENT_HANDLER_ID = 1;

  uint64_t newRegistrationId = NEXT_EVENT_HANDLER_ID++;
  auto eventNameStr = eventName.asString(rt).utf8(rt);
  auto handlerShareable = extractShareableOrThrow<ShareableWorklet>(
      rt, worklet, "[Reanimated] Event handler must be a worklet.");
  int emitterReactTagInt = emitterReactTag.asNumber();

  uiScheduler_->scheduleOnUI([=] {
    auto handler = std::make_shared<WorkletEventHandler>(
        newRegistrationId, eventNameStr, emitterReactTagInt, handlerShareable);
    eventHandlerRegistry_->registerEventHandler(std::move(handler));
  });

  return jsi::Value(static_cast<double>(newRegistrationId));
}

void NativeReanimatedModule::unregisterEventHandler(
    jsi::Runtime &,
    const jsi::Value &registrationId) {
  uint64_t id = registrationId.asNumber();
  uiScheduler_->scheduleOnUI(
      [=] { eventHandlerRegistry_->unregisterEventHandler(id); });
}

jsi::Value NativeReanimatedModule::getViewProp(
    jsi::Runtime &rnRuntime,
    const jsi::Value &viewTag,
    const jsi::Value &propName,
    const jsi::Value &callback) {
#ifdef RCT_NEW_ARCH_ENABLED
  throw std::runtime_error(
      "[Reanimated] getViewProp is not implemented on Fabric yet");
#else
  const int viewTagInt = viewTag.asNumber();
  const auto propNameStr = propName.asString(rnRuntime).utf8(rnRuntime);
  const auto funPtr = std::make_shared<jsi::Function>(
      callback.getObject(rnRuntime).asFunction(rnRuntime));

  uiScheduler_->scheduleOnUI([=]() {
    jsi::Runtime &uiRuntime = uiWorkletRuntime_->getJSIRuntime();
    const auto propNameValue =
        jsi::String::createFromUtf8(uiRuntime, propNameStr);
    const auto resultValue =
        obtainPropFunction_(uiRuntime, viewTagInt, propNameValue);
    const auto resultStr = resultValue.asString(uiRuntime).utf8(uiRuntime);

    jsScheduler_->scheduleOnJS([=](jsi::Runtime &rnRuntime) {
      const auto resultValue =
          jsi::String::createFromUtf8(rnRuntime, resultStr);
      funPtr->call(rnRuntime, resultValue);
    });
  });

  return jsi::Value::undefined();
#endif
}

jsi::Value NativeReanimatedModule::enableLayoutAnimations(
    jsi::Runtime &,
    const jsi::Value &config) {
  FeaturesConfig::setLayoutAnimationEnabled(config.getBool());
  return jsi::Value::undefined();
}

jsi::Value NativeReanimatedModule::configureProps(
    jsi::Runtime &rt,
    const jsi::Value &uiProps,
    const jsi::Value &nativeProps) {
#ifdef RCT_NEW_ARCH_ENABLED
  (void)uiProps; // unused variable on Fabric
  jsi::Array array = nativeProps.asObject(rt).asArray(rt);
  for (size_t i = 0; i < array.size(rt); ++i) {
    std::string name = array.getValueAtIndex(rt, i).asString(rt).utf8(rt);
    nativePropNames_.insert(name);
  }
#else
  configurePropsPlatformFunction_(rt, uiProps, nativeProps);
#endif // RCT_NEW_ARCH_ENABLED

  return jsi::Value::undefined();
}

jsi::Value NativeReanimatedModule::configureLayoutAnimation(
    jsi::Runtime &rt,
    const jsi::Value &viewTag,
    const jsi::Value &type,
    const jsi::Value &sharedTransitionTag,
    const jsi::Value &config) {
  layoutAnimationsManager_.configureAnimation(
      viewTag.asNumber(),
      static_cast<LayoutAnimationType>(type.asNumber()),
      sharedTransitionTag.asString(rt).utf8(rt),
      extractShareableOrThrow<ShareableObject>(
          rt,
          config,
          "[Reanimated] Layout animation config must be an object."));
  return jsi::Value::undefined();
}

bool NativeReanimatedModule::isAnyHandlerWaitingForEvent(
    const std::string &eventName,
    const int emitterReactTag) {
  return eventHandlerRegistry_->isAnyHandlerWaitingForEvent(
      eventName, emitterReactTag);
}

void NativeReanimatedModule::requestAnimationFrame(
    jsi::Runtime &rt,
    const jsi::Value &callback) {
  frameCallbacks_.push_back(std::make_shared<jsi::Value>(rt, callback));
  maybeRequestRender();
}

void NativeReanimatedModule::maybeRequestRender() {
  if (!renderRequested_) {
    renderRequested_ = true;
    jsi::Runtime &uiRuntime = uiWorkletRuntime_->getJSIRuntime();
    requestRender_(onRenderCallback_, uiRuntime);
  }
}

void NativeReanimatedModule::onRender(double timestampMs) {
  auto callbacks = std::move(frameCallbacks_);
  frameCallbacks_.clear();
  jsi::Runtime &uiRuntime = uiWorkletRuntime_->getJSIRuntime();
  jsi::Value timestamp{timestampMs};
  for (const auto &callback : callbacks) {
    runOnRuntimeGuarded(uiRuntime, *callback, timestamp);
  }
}

jsi::Value NativeReanimatedModule::registerSensor(
    jsi::Runtime &rt,
    const jsi::Value &sensorType,
    const jsi::Value &interval,
    const jsi::Value &iosReferenceFrame,
    const jsi::Value &sensorDataHandler) {
  return animatedSensorModule_.registerSensor(
      rt,
      uiWorkletRuntime_,
      sensorType,
      interval,
      iosReferenceFrame,
      sensorDataHandler);
}

void NativeReanimatedModule::unregisterSensor(
    jsi::Runtime &,
    const jsi::Value &sensorId) {
  animatedSensorModule_.unregisterSensor(sensorId);
}

void NativeReanimatedModule::cleanupSensors() {
  animatedSensorModule_.unregisterAllSensors();
}

#ifdef RCT_NEW_ARCH_ENABLED
bool NativeReanimatedModule::isThereAnyLayoutProp(
    jsi::Runtime &rt,
    const jsi::Object &props) {
  const jsi::Array propNames = props.getPropertyNames(rt);
  for (size_t i = 0; i < propNames.size(rt); ++i) {
    const std::string propName =
        propNames.getValueAtIndex(rt, i).asString(rt).utf8(rt);
    bool isLayoutProp =
        nativePropNames_.find(propName) != nativePropNames_.end();
    if (isLayoutProp) {
      return true;
    }
  }
  return false;
}
#endif // RCT_NEW_ARCH_ENABLED

bool NativeReanimatedModule::handleEvent(
    const std::string &eventName,
    const int emitterReactTag,
    const jsi::Value &payload,
    double currentTime) {
  eventHandlerRegistry_->processEvent(
      uiWorkletRuntime_, currentTime, eventName, emitterReactTag, payload);

  // TODO: return true if Reanimated successfully handled the event
  // to avoid sending it to JavaScript
  return false;
}

#ifdef RCT_NEW_ARCH_ENABLED
bool NativeReanimatedModule::handleRawEvent(
    const RawEvent &rawEvent,
    double currentTime) {
  const EventTarget *eventTarget = rawEvent.eventTarget.get();
  if (eventTarget == nullptr) {
    // after app reload scrollview is unmounted and its content offset is set to
    // 0 and view is thrown into recycle pool setting content offset triggers
    // scroll event eventTarget is null though, because it's unmounting we can
    // just ignore this event, because it's an event on unmounted component
    return false;
  }
  const std::string &type = rawEvent.type;
  const ValueFactory &payloadFactory = rawEvent.payloadFactory;

  int tag = eventTarget->getTag();
  std::string eventType = type;
  if (eventType.rfind("top", 0) == 0) {
    eventType = "on" + eventType.substr(3);
  }
  jsi::Runtime &rt = uiWorkletRuntime_->getJSIRuntime();
  jsi::Value payload = payloadFactory(rt);

  auto res = handleEvent(eventType, tag, std::move(payload), currentTime);
  // TODO: we should call performOperations conditionally if event is handled
  // (res == true), but for now handleEvent always returns false. Thankfully,
  // performOperations does not trigger a lot of code if there is nothing to be
  // done so this is fine for now.
  performOperations();
  return res;
}

void NativeReanimatedModule::updateProps(
    jsi::Runtime &rt,
    const jsi::Value &operations) {
  auto array = operations.asObject(rt).asArray(rt);
  size_t length = array.size(rt);
  for (size_t i = 0; i < length; ++i) {
    auto item = array.getValueAtIndex(rt, i).asObject(rt);
    auto shadowNodeWrapper = item.getProperty(rt, "shadowNodeWrapper");
    auto shadowNode = shadowNodeFromValue(rt, shadowNodeWrapper);
    const jsi::Value &updates = item.getProperty(rt, "updates");
    operationsInBatch_.emplace_back(
        shadowNode, std::make_unique<jsi::Value>(rt, updates));

    // TODO: support multiple surfaces
    surfaceId_ = shadowNode->getSurfaceId();
  }
}

void NativeReanimatedModule::performOperations() {
  if (operationsInBatch_.empty() && tagsToRemove_.empty()) {
    // nothing to do
    return;
  }

  auto copiedOperationsQueue = std::move(operationsInBatch_);
  operationsInBatch_.clear();

  jsi::Runtime &rt = uiWorkletRuntime_->getJSIRuntime();

  {
    auto lock = propsRegistry_->createLock();

    // remove recently unmounted ShadowNodes from PropsRegistry
    if (!tagsToRemove_.empty()) {
      for (auto tag : tagsToRemove_) {
        propsRegistry_->remove(tag);
      }
      tagsToRemove_.clear();
    }

    // Even if only non-layout props are changed, we need to store the update in
    // PropsRegistry anyway so that React doesn't overwrite it in the next
    // render. Currently, only opacity and transform are treated in a special
    // way but backgroundColor, shadowOpacity etc. would get overwritten (see
    // `_propKeysManagedByAnimated_DO_NOT_USE_THIS_IS_BROKEN`).
    for (const auto &[shadowNode, props] : copiedOperationsQueue) {
      propsRegistry_->update(shadowNode, dynamicFromValue(rt, *props));
    }
  }

  bool hasLayoutUpdates = false;
  for (const auto &[shadowNode, props] : copiedOperationsQueue) {
    if (isThereAnyLayoutProp(rt, props->asObject(rt))) {
      hasLayoutUpdates = true;
      break;
    }
  }

  if (!hasLayoutUpdates) {
    // If there's no layout props to be updated, we can apply the updates
    // directly onto the components and skip the commit.
    for (const auto &[shadowNode, props] : copiedOperationsQueue) {
      Tag tag = shadowNode->getTag();
      synchronouslyUpdateUIPropsFunction_(rt, tag, props->asObject(rt));
    }
    return;
  }

  if (propsRegistry_->shouldReanimatedSkipCommit()) {
    // It may happen that `performOperations` is called on the UI thread
    // while React Native tries to commit a new tree on the JS thread.
    // In this case, we should skip the commit here and let React Native do it.
    // The commit will include the current values from PropsRegistry
    // which will be applied in ReanimatedCommitHook.
    return;
  }

  react_native_assert(uiManager_ != nullptr);
  const auto &shadowTreeRegistry = uiManager_->getShadowTreeRegistry();

  shadowTreeRegistry.visit(surfaceId_, [&](ShadowTree const &shadowTree) {
    // Mark the commit as Reanimated commit so that we can distinguish it
    // in ReanimatedCommitHook.
    ReanimatedCommitMarker commitMarker;

    shadowTree.commit(
        [&](RootShadowNode const &oldRootShadowNode)
            -> RootShadowNode::Unshared {
          auto rootNode =
              oldRootShadowNode.ShadowNode::clone(ShadowNodeFragment{});

          ShadowTreeCloner shadowTreeCloner{*uiManager_, surfaceId_};

          for (const auto &[shadowNode, props] : copiedOperationsQueue) {
            const ShadowNodeFamily &family = shadowNode->getFamily();
            react_native_assert(family.getSurfaceId() == surfaceId_);

#if REACT_NATIVE_MINOR_VERSION >= 73
            // Fix for catching nullptr returned from commit hook was introduced
            // in 0.72.4 but we have only check for minor version of React
            // Native so enable that optimization in React Native >= 0.73
            if (propsRegistry_->shouldReanimatedSkipCommit()) {
              return nullptr;
            }
#endif

            auto newRootNode = shadowTreeCloner.cloneWithNewProps(
                rootNode, family, RawProps(rt, *props));

            if (newRootNode == nullptr) {
              // this happens when React removed the component but Reanimated
              // still tries to animate it, let's skip update for this
              // specific component
              continue;
            }
            rootNode = newRootNode;
          }

          auto newRoot = std::static_pointer_cast<RootShadowNode>(rootNode);

          return newRoot;
        },
        { /* .enableStateReconciliation = */
          false,
#if REACT_NATIVE_MINOR_VERSION >= 72
              /* .mountSynchronously = */ true,
#endif
              /* .shouldYield = */ [this]() {
                return propsRegistry_->shouldReanimatedSkipCommit();
              }
        });
  });
}

void NativeReanimatedModule::removeFromPropsRegistry(
    jsi::Runtime &rt,
    const jsi::Value &viewTags) {
  auto array = viewTags.asObject(rt).asArray(rt);
  for (size_t i = 0, size = array.size(rt); i < size; ++i) {
    tagsToRemove_.push_back(array.getValueAtIndex(rt, i).asNumber());
  }
}

void NativeReanimatedModule::dispatchCommand(
    jsi::Runtime &rt,
    const jsi::Value &shadowNodeValue,
    const jsi::Value &commandNameValue,
    const jsi::Value &argsValue) {
  ShadowNode::Shared shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  std::string commandName = stringFromValue(rt, commandNameValue);
  folly::dynamic args = commandArgsFromValue(rt, argsValue);
  uiManager_->dispatchCommand(shadowNode, commandName, args);
}

jsi::Value NativeReanimatedModule::measure(
    jsi::Runtime &rt,
    const jsi::Value &shadowNodeValue) {
  // based on implementation from UIManagerBinding.cpp

  auto shadowNode = shadowNodeFromValue(rt, shadowNodeValue);
  auto layoutMetrics = uiManager_->getRelativeLayoutMetrics(
      *shadowNode, nullptr, {/* .includeTransform = */ true});

  if (layoutMetrics == EmptyLayoutMetrics) {
    // Originally, in this case React Native returns `{0, 0, 0, 0, 0, 0}`, most
    // likely due to the type of measure callback function which accepts just an
    // array of numbers (not null). In Reanimated, `measure` returns
    // `MeasuredDimensions | null`.
    return jsi::Value::null();
  }
  auto newestCloneOfShadowNode =
      uiManager_->getNewestCloneOfShadowNode(*shadowNode);

  auto layoutableShadowNode =
      traitCast<LayoutableShadowNode const *>(newestCloneOfShadowNode.get());
  facebook::react::Point originRelativeToParent =
      layoutableShadowNode != nullptr
      ? layoutableShadowNode->getLayoutMetrics().frame.origin
      : facebook::react::Point();

  auto frame = layoutMetrics.frame;

  jsi::Object result(rt);
  result.setProperty(
      rt, "x", jsi::Value(static_cast<double>(originRelativeToParent.x)));
  result.setProperty(
      rt, "y", jsi::Value(static_cast<double>(originRelativeToParent.y)));
  result.setProperty(
      rt, "width", jsi::Value(static_cast<double>(frame.size.width)));
  result.setProperty(
      rt, "height", jsi::Value(static_cast<double>(frame.size.height)));
  result.setProperty(
      rt, "pageX", jsi::Value(static_cast<double>(frame.origin.x)));
  result.setProperty(
      rt, "pageY", jsi::Value(static_cast<double>(frame.origin.y)));
  return result;
}

void NativeReanimatedModule::initializeFabric(
    const std::shared_ptr<UIManager> &uiManager) {
  uiManager_ = uiManager;
  commitHook_ =
      std::make_shared<ReanimatedCommitHook>(propsRegistry_, uiManager_);
#if REACT_NATIVE_MINOR_VERSION >= 73
  mountHook_ = std::make_shared<ReanimatedMountHook>(propsRegistry, uiManager_);
#endif
}
#endif // RCT_NEW_ARCH_ENABLED

jsi::Value NativeReanimatedModule::subscribeForKeyboardEvents(
    jsi::Runtime &rt,
    const jsi::Value &handlerWorklet,
    const jsi::Value &isStatusBarTranslucent) {
  auto shareableHandler = extractShareableOrThrow<ShareableWorklet>(
      rt,
      handlerWorklet,
      "[Reanimated] Keyboard event handler must be a worklet.");
  return subscribeForKeyboardEventsFunction_(
      [=](int keyboardState, int height) {
        uiWorkletRuntime_->runGuarded(
            shareableHandler, jsi::Value(keyboardState), jsi::Value(height));
      },
      isStatusBarTranslucent.getBool());
}

void NativeReanimatedModule::unsubscribeFromKeyboardEvents(
    jsi::Runtime &,
    const jsi::Value &listenerId) {
  unsubscribeFromKeyboardEventsFunction_(listenerId.asNumber());
}

} // namespace reanimated
