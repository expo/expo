#import <RNReanimated/LayoutAnimationsManager.h>
#import <RNReanimated/NativeMethods.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAAnimationsManager.h>
#import <RNReanimated/REAIOSErrorHandler.h>
#import <RNReanimated/REAIOSScheduler.h>
#import <RNReanimated/REAJSIUtils.h>
#import <RNReanimated/REAKeyboardEventObserver.h>
#import <RNReanimated/REAMessageThread.h>
#import <RNReanimated/REAModule.h>
#import <RNReanimated/REANodesManager.h>
#import <RNReanimated/REAUIManager.h>
#import <RNReanimated/RNGestureHandlerStateManager.h>
#import <RNReanimated/ReanimatedRuntime.h>
#import <RNReanimated/ReanimatedSensorContainer.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <RNReanimated/ReanimatedUIManagerBinding.h>
#import <React-Fabric/react/renderer/core/ShadowNode.h>
#import <React-Fabric/react/renderer/uimanager/primitives.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTScheduler.h>
#import <React/RCTSurfacePresenter.h>
#else
#import <folly/json.h>
#endif

#import <React/RCTFollyConvert.h>
#import <React/RCTUIManager.h>

#if TARGET_IPHONE_SIMULATOR
#import <dlfcn.h>
#endif

@interface RCTBridge (JSIRuntime)
- (void *)runtime;
@end

namespace reanimated {

using namespace facebook;
using namespace react;

static CGFloat SimAnimationDragCoefficient(void)
{
  static float (*UIAnimationDragCoefficient)(void) = NULL;
#if TARGET_IPHONE_SIMULATOR
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    UIAnimationDragCoefficient = (float (*)(void))dlsym(RTLD_DEFAULT, "UIAnimationDragCoefficient");
  });
#endif
  return UIAnimationDragCoefficient ? UIAnimationDragCoefficient() : 1.f;
}

static CFTimeInterval calculateTimestampWithSlowAnimations(CFTimeInterval currentTimestamp)
{
#if TARGET_IPHONE_SIMULATOR
  static CFTimeInterval dragCoefChangedTimestamp = CACurrentMediaTime();
  static CGFloat previousDragCoef = SimAnimationDragCoefficient();

  const CGFloat dragCoef = SimAnimationDragCoefficient();
  if (previousDragCoef != dragCoef) {
    previousDragCoef = dragCoef;
    dragCoefChangedTimestamp = CACurrentMediaTime();
  }

  const bool areSlowAnimationsEnabled = dragCoef != 1.f;
  if (areSlowAnimationsEnabled) {
    return (dragCoefChangedTimestamp + (currentTimestamp - dragCoefChangedTimestamp) / dragCoef);
  } else {
    return currentTimestamp;
  }
#else
  return currentTimestamp;
#endif
}

static NSSet *convertProps(jsi::Runtime &rt, const jsi::Value &props)
{
  NSMutableSet *propsSet = [[NSMutableSet alloc] init];
  jsi::Array propsNames = props.asObject(rt).asArray(rt);
  for (int i = 0; i < propsNames.size(rt); i++) {
    NSString *propName = @(propsNames.getValueAtIndex(rt, i).asString(rt).utf8(rt).c_str());
    [propsSet addObject:propName];
  }
  return propsSet;
}

std::shared_ptr<NativeReanimatedModule> createReanimatedModule(
    RCTBridge *bridge,
    std::shared_ptr<CallInvoker> jsInvoker)
{
  REAModule *reanimatedModule = [bridge moduleForClass:[REAModule class]];

#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
  RCTUIManager *uiManager = reanimatedModule.nodesManager.uiManager;
  auto updatePropsFunction =
      [reanimatedModule](jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &props) -> void {
    NSString *nsViewName = [NSString stringWithCString:viewName.asString(rt).utf8(rt).c_str()
                                              encoding:[NSString defaultCStringEncoding]];

    NSDictionary *propsDict = convertJSIObjectToNSDictionary(rt, props);
    [reanimatedModule.nodesManager updateProps:propsDict
                                 ofViewWithTag:[NSNumber numberWithInt:viewTag]
                                      withName:nsViewName];
  };

  auto measureFunction = [uiManager](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag, uiManager);
  };

  auto scrollToFunction = [uiManager](int viewTag, double x, double y, bool animated) {
    scrollTo(viewTag, uiManager, x, y, animated);
  };
#endif

  id<RNGestureHandlerStateManager> gestureHandlerStateManager = nil;
  auto setGestureStateFunction = [gestureHandlerStateManager, bridge](int handlerTag, int newState) mutable {
    if (gestureHandlerStateManager == nil) {
      gestureHandlerStateManager = [bridge moduleForName:@"RNGestureHandlerModule"];
    }

    setGestureState(gestureHandlerStateManager, handlerTag, newState);
  };

#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
  auto propObtainer = [reanimatedModule](
                          jsi::Runtime &rt, const int viewTag, const jsi::String &propName) -> jsi::Value {
    NSString *propNameConverted = [NSString stringWithFormat:@"%s", propName.utf8(rt).c_str()];
    std::string resultStr = std::string([[reanimatedModule.nodesManager obtainProp:[NSNumber numberWithInt:viewTag]
                                                                          propName:propNameConverted] UTF8String]);
    jsi::Value val = jsi::String::createFromUtf8(rt, resultStr);
    return val;
  };
#endif

  auto jsQueue = std::make_shared<REAMessageThread>([NSRunLoop currentRunLoop], ^(NSError *error) {
    throw error;
  });
  auto rnRuntime = reinterpret_cast<facebook::jsi::Runtime *>(reanimatedModule.bridge.runtime);
  std::shared_ptr<jsi::Runtime> animatedRuntime = ReanimatedRuntime::make(rnRuntime, jsQueue);

  std::shared_ptr<Scheduler> scheduler = std::make_shared<REAIOSScheduler>(jsInvoker);
  std::shared_ptr<ErrorHandler> errorHandler = std::make_shared<REAIOSErrorHandler>(scheduler);
  std::shared_ptr<NativeReanimatedModule> module;

  auto nodesManager = reanimatedModule.nodesManager;

  auto maybeFlushUIUpdatesQueueFunction = [nodesManager]() { [nodesManager maybeFlushUIUpdatesQueue]; };

  auto requestRender = [nodesManager, &module](std::function<void(double)> onRender, jsi::Runtime &rt) {
    [nodesManager postOnAnimation:^(CADisplayLink *displayLink) {
      double frameTimestamp = calculateTimestampWithSlowAnimations(displayLink.targetTimestamp) * 1000;
      onRender(frameTimestamp);
    }];
  };

#ifdef RCT_NEW_ARCH_ENABLED
  auto synchronouslyUpdateUIPropsFunction = [nodesManager](jsi::Runtime &rt, Tag tag, const jsi::Value &props) {
    NSNumber *viewTag = @(tag);
    NSDictionary *uiProps = convertJSIObjectToNSDictionary(rt, props.asObject(rt));
    [nodesManager synchronouslyUpdateViewOnUIThread:viewTag props:uiProps];
  };

  auto progressLayoutAnimation = [=](int tag, const jsi::Object &newStyle, bool isSharedTransition) {
    // noop
  };

  auto endLayoutAnimation = [=](int tag, bool isCancelled, bool removeView) {
    // noop
  };

#else
  // Layout Animations start
  __block std::weak_ptr<Scheduler> weakScheduler = scheduler;
  ((REAUIManager *)uiManager).flushUiOperations = ^void() {
    std::shared_ptr<Scheduler> scheduler = weakScheduler.lock();
    if (scheduler != nullptr) {
      scheduler->triggerUI();
    }
  };

  REAUIManager *reaUiManagerNoCast = [bridge moduleForClass:[REAUIManager class]];
  RCTUIManager *reaUiManager = reaUiManagerNoCast;
  REAAnimationsManager *animationsManager = [[REAAnimationsManager alloc] initWithUIManager:reaUiManager];
  [reaUiManagerNoCast setUp:animationsManager];

  __weak REAAnimationsManager *weakAnimationsManager = animationsManager;
  std::weak_ptr<jsi::Runtime> wrt = animatedRuntime;

  auto progressLayoutAnimation = [=](int tag, const jsi::Object &newStyle, bool isSharedTransition) {
    NSDictionary *propsDict = convertJSIObjectToNSDictionary(*wrt.lock(), newStyle);
    [weakAnimationsManager progressLayoutAnimationWithStyle:propsDict
                                                     forTag:@(tag)
                                         isSharedTransition:isSharedTransition];
  };

  auto endLayoutAnimation = [=](int tag, bool isCancelled, bool removeView) {
    [weakAnimationsManager endLayoutAnimationForTag:@(tag) cancelled:isCancelled removeView:removeView];
  };

  auto configurePropsFunction = [reanimatedModule](
                                    jsi::Runtime &rt, const jsi::Value &uiProps, const jsi::Value &nativeProps) {
    NSSet *uiPropsSet = convertProps(rt, uiProps);
    NSSet *nativePropsSet = convertProps(rt, nativeProps);
    [reanimatedModule.nodesManager configureUiProps:uiPropsSet andNativeProps:nativePropsSet];
  };

  // Layout Animations end
#endif

  auto getCurrentTime = []() { return calculateTimestampWithSlowAnimations(CACurrentMediaTime()) * 1000; };

  // sensors
  ReanimatedSensorContainer *reanimatedSensorContainer = [[ReanimatedSensorContainer alloc] init];
  auto registerSensorFunction =
      [=](int sensorType, int interval, int iosReferenceFrame, std::function<void(double[], int)> setter) -> int {
    return [reanimatedSensorContainer registerSensor:(ReanimatedSensorType)sensorType
                                            interval:interval
                                   iosReferenceFrame:iosReferenceFrame
                                              setter:^(double *data, int orientationDegrees) {
                                                setter(data, orientationDegrees);
                                              }];
  };

  auto unregisterSensorFunction = [=](int sensorId) { [reanimatedSensorContainer unregisterSensor:sensorId]; };
  // end sensors

  // keyboard events

  REAKeyboardEventObserver *keyboardObserver = [[REAKeyboardEventObserver alloc] init];
  auto subscribeForKeyboardEventsFunction =
      [=](std::function<void(int keyboardState, int height)> keyboardEventDataUpdater, bool isStatusBarTranslucent) {
        // ignore isStatusBarTranslucent - it's Android only
        return [keyboardObserver subscribeForKeyboardEvents:^(int keyboardState, int height) {
          keyboardEventDataUpdater(keyboardState, height);
        }];
      };

  auto unsubscribeFromKeyboardEventsFunction = [=](int listenerId) {
    [keyboardObserver unsubscribeFromKeyboardEvents:listenerId];
  };
  // end keyboard events

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
      maybeFlushUIUpdatesQueueFunction,
  };

  module = std::make_shared<NativeReanimatedModule>(
      jsInvoker,
      scheduler,
      animatedRuntime,
      errorHandler,
#ifdef RCT_NEW_ARCH_ENABLED
  // nothing
#else
      propObtainer,
#endif
      platformDepMethodsHolder);

  scheduler->setRuntimeManager(module);

  [reanimatedModule.nodesManager registerEventHandler:^(NSString *eventNameNSString, id<RCTEvent> event) {
    // handles RCTEvents from RNGestureHandler
    std::string eventName = [eventNameNSString UTF8String];
    id eventData = [event arguments][2];
    jsi::Runtime &rt = *module->runtime;
    jsi::Value payload = convertObjCObjectToJSIValue(rt, eventData);
    double currentTime = CACurrentMediaTime() * 1000;
    module->handleEvent(eventName, payload, currentTime);
  }];

  std::weak_ptr<NativeReanimatedModule> weakModule = module; // to avoid retain cycle
#ifdef RCT_NEW_ARCH_ENABLED
  [reanimatedModule.nodesManager registerPerformOperations:^() {
    if (auto module = weakModule.lock()) {
      module->performOperations();
    }
  }];
#else
  // Layout Animation callbacks setup
  [animationsManager
      setAnimationStartingBlock:^(
          NSNumber *_Nonnull tag, LayoutAnimationType type, NSDictionary *_Nonnull values, NSNumber *depth) {
        auto reaModule = weakModule.lock();
        if (reaModule == nullptr) {
          return;
        }

        jsi::Runtime &rt = *wrt.lock();
        jsi::Object yogaValues(rt);
        for (NSString *key in values.allKeys) {
          NSObject *value = values[key];
          if ([values[key] isKindOfClass:[NSArray class]]) {
            NSArray *transformArray = (NSArray *)value;
            jsi::Array matrix(rt, 9);
            for (int i = 0; i < 9; i++) {
              matrix.setValueAtIndex(rt, i, [(NSNumber *)transformArray[i] doubleValue]);
            }
            yogaValues.setProperty(rt, [key UTF8String], matrix);
          } else {
            yogaValues.setProperty(rt, [key UTF8String], [(NSNumber *)value doubleValue]);
          }
        }

        reaModule->layoutAnimationsManager().startLayoutAnimation(rt, [tag intValue], type, yogaValues);
      }];

  [animationsManager setHasAnimationBlock:^(NSNumber *_Nonnull tag, LayoutAnimationType type) {
    auto reaModule = weakModule.lock();
    if (reaModule == nullptr) {
      return NO;
    }
    bool hasLayoutAnimation = reaModule->layoutAnimationsManager().hasLayoutAnimation([tag intValue], type);
    return hasLayoutAnimation ? YES : NO;
  }];

  [animationsManager setAnimationRemovingBlock:^(NSNumber *_Nonnull tag) {
    auto reaModule = weakModule.lock();
    if (reaModule == nullptr) {
      return;
    }
    reaModule->layoutAnimationsManager().clearLayoutAnimationConfig([tag intValue]);
  }];

  [animationsManager
      setCancelAnimationBlock:^(NSNumber *_Nonnull tag, LayoutAnimationType type, BOOL cancelled, BOOL removeView) {
        if (auto reaModule = weakModule.lock()) {
          if (auto runtime = wrt.lock()) {
            jsi::Runtime &rt = *runtime;
            reaModule->layoutAnimationsManager().cancelLayoutAnimation(
                rt, [tag intValue], type, cancelled == YES, removeView == YES);
          }
        }
      }];

  [animationsManager setFindPrecedingViewTagForTransitionBlock:^NSNumber *_Nullable(NSNumber *_Nonnull tag) {
    if (auto reaModule = weakModule.lock()) {
      int resultTag = reaModule->layoutAnimationsManager().findPrecedingViewTagForTransition([tag intValue]);
      return resultTag == -1 ? nil : @(resultTag);
    }
    return nil;
  }];
#endif

  return module;
}

} // namespace reanimated
