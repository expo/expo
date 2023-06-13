#import <ABI47_0_0RNReanimated/LayoutAnimationsProxy.h>
#import <ABI47_0_0RNReanimated/NativeMethods.h>
#import <ABI47_0_0RNReanimated/NativeProxy.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAAnimationsManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAIOSErrorHandler.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAIOSScheduler.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAKeyboardEventObserver.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAModule.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REANodesManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAUIManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0RNGestureHandlerStateManager.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0ReanimatedSensorContainer.h>
#import <ABI47_0_0React/ABI47_0_0RCTFollyConvert.h>
#import <ABI47_0_0React/ABI47_0_0RCTUIManager.h>
#import <folly/json.h>

#if TARGET_IPHONE_SIMULATOR
#import <dlfcn.h>
#endif

#if __has_include(<ABI47_0_0reacthermes/ABI47_0_0HermesExecutorFactory.h>)
#import <ABI47_0_0reacthermes/ABI47_0_0HermesExecutorFactory.h>
#else
#import <ABI47_0_0jsi/ABI47_0_0JSCRuntime.h>
#endif

namespace ABI47_0_0reanimated {

using namespace ABI47_0_0facebook;
using namespace ABI47_0_0React;

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

// COPIED FROM ABI47_0_0RCTTurboModule.mm
static id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value);

static NSString *convertJSIStringToNSString(jsi::Runtime &runtime, const jsi::String &value)
{
  return [NSString stringWithUTF8String:value.utf8(runtime).c_str()];
}

static NSDictionary *convertJSIObjectToNSDictionary(jsi::Runtime &runtime, const jsi::Object &value)
{
  jsi::Array propertyNames = value.getPropertyNames(runtime);
  size_t size = propertyNames.size(runtime);
  NSMutableDictionary *result = [NSMutableDictionary new];
  for (size_t i = 0; i < size; i++) {
    jsi::String name = propertyNames.getValueAtIndex(runtime, i).getString(runtime);
    NSString *k = convertJSIStringToNSString(runtime, name);
    id v = convertJSIValueToObjCObject(runtime, value.getProperty(runtime, name));
    if (v) {
      result[k] = v;
    }
  }
  return [result copy];
}

static NSArray *convertJSIArrayToNSArray(jsi::Runtime &runtime, const jsi::Array &value)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    [result addObject:convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i)) ?: (id)kCFNull];
  }
  return [result copy];
}

static id convertJSIValueToObjCObject(jsi::Runtime &runtime, const jsi::Value &value)
{
  if (value.isUndefined() || value.isNull()) {
    return nil;
  }
  if (value.isBool()) {
    return @(value.getBool());
  }
  if (value.isNumber()) {
    return @(value.getNumber());
  }
  if (value.isString()) {
    return convertJSIStringToNSString(runtime, value.getString(runtime));
  }
  if (value.isObject()) {
    jsi::Object o = value.getObject(runtime);
    if (o.isArray(runtime)) {
      return convertJSIArrayToNSArray(runtime, o.getArray(runtime));
    }
    return convertJSIObjectToNSDictionary(runtime, o);
  }

  throw std::runtime_error("Unsupported jsi::jsi::Value kind");
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
    ABI47_0_0RCTBridge *bridge,
    std::shared_ptr<CallInvoker> jsInvoker)
{
  ABI47_0_0REAModule *reanimatedModule = [bridge moduleForClass:[ABI47_0_0REAModule class]];

  auto propUpdater = [reanimatedModule](
                         jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &props) -> void {
    NSString *nsViewName = [NSString stringWithCString:viewName.asString(rt).utf8(rt).c_str()
                                              encoding:[NSString defaultCStringEncoding]];

    NSDictionary *propsDict = convertJSIObjectToNSDictionary(rt, props);
    [reanimatedModule.nodesManager updateProps:propsDict
                                 ofViewWithTag:[NSNumber numberWithInt:viewTag]
                                      withName:nsViewName];
  };

  ABI47_0_0RCTUIManager *uiManager = reanimatedModule.nodesManager.uiManager;
  auto measuringFunction = [uiManager](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag, uiManager);
  };

  auto scrollToFunction = [uiManager](int viewTag, double x, double y, bool animated) {
    scrollTo(viewTag, uiManager, x, y, animated);
  };

  id<ABI47_0_0RNGestureHandlerStateManager> gestureHandlerStateManager = nil;
  auto setGestureStateFunction = [gestureHandlerStateManager, bridge](int handlerTag, int newState) mutable {
    if (gestureHandlerStateManager == nil) {
      gestureHandlerStateManager = [bridge moduleForName:@"ABI47_0_0RNGestureHandlerModule"];
    }

    setGestureState(gestureHandlerStateManager, handlerTag, newState);
  };

  auto propObtainer = [reanimatedModule](
                          jsi::Runtime &rt, const int viewTag, const jsi::String &propName) -> jsi::Value {
    NSString *propNameConverted = [NSString stringWithFormat:@"%s", propName.utf8(rt).c_str()];
    std::string resultStr = std::string([[reanimatedModule.nodesManager obtainProp:[NSNumber numberWithInt:viewTag]
                                                                          propName:propNameConverted] UTF8String]);
    jsi::Value val = jsi::String::createFromUtf8(rt, resultStr);
    return val;
  };

#if __has_include(<ABI47_0_0reacthermes/ABI47_0_0HermesExecutorFactory.h>)
  std::shared_ptr<jsi::Runtime> animatedRuntime = ABI47_0_0facebook::ABI47_0_0hermes::makeHermesRuntime();
#else
  std::shared_ptr<jsi::Runtime> animatedRuntime = ABI47_0_0facebook::jsc::makeJSCRuntime();
#endif

  std::shared_ptr<Scheduler> scheduler = std::make_shared<ABI47_0_0REAIOSScheduler>(jsInvoker);
  std::shared_ptr<ErrorHandler> errorHandler = std::make_shared<ABI47_0_0REAIOSErrorHandler>(scheduler);
  std::shared_ptr<NativeReanimatedModule> module;

  __block std::weak_ptr<Scheduler> weakScheduler = scheduler;
  ((ABI47_0_0REAUIManager *)uiManager).flushUiOperations = ^void() {
    std::shared_ptr<Scheduler> scheduler = weakScheduler.lock();
    if (scheduler != nullptr) {
      scheduler->triggerUI();
    }
  };

  auto nodesManager = reanimatedModule.nodesManager;

  auto requestRender = [nodesManager, &module](std::function<void(double)> onRender, jsi::Runtime &rt) {
    [nodesManager postOnAnimation:^(CADisplayLink *displayLink) {
      double frameTimestamp = calculateTimestampWithSlowAnimations(displayLink.targetTimestamp) * 1000;
      jsi::Object global = rt.global();
      jsi::String frameTimestampName = jsi::String::createFromAscii(rt, "_frameTimestamp");
      global.setProperty(rt, frameTimestampName, frameTimestamp);
      onRender(frameTimestamp);
      global.setProperty(rt, frameTimestampName, jsi::Value::undefined());
    }];
  };

  auto getCurrentTime = []() { return calculateTimestampWithSlowAnimations(CACurrentMediaTime()) * 1000; };

  // Layout Animations start
  ABI47_0_0REAUIManager *reaUiManagerNoCast = [bridge moduleForClass:[ABI47_0_0REAUIManager class]];
  ABI47_0_0RCTUIManager *reaUiManager = reaUiManagerNoCast;
  ABI47_0_0REAAnimationsManager *animationsManager = [[ABI47_0_0REAAnimationsManager alloc] initWithUIManager:reaUiManager];
  [reaUiManagerNoCast setUp:animationsManager];

  auto notifyAboutProgress = [=](int tag, jsi::Object newStyle) {
    if (animationsManager) {
      NSDictionary *propsDict = convertJSIObjectToNSDictionary(*animatedRuntime, newStyle);
      [animationsManager notifyAboutProgress:propsDict tag:[NSNumber numberWithInt:tag]];
    }
  };

  auto notifyAboutEnd = [=](int tag, bool isCancelled) {
    if (animationsManager) {
      [animationsManager notifyAboutEnd:[NSNumber numberWithInt:tag] cancelled:isCancelled];
    }
  };

  auto configurePropsFunction = [reanimatedModule](
                                    jsi::Runtime &rt, const jsi::Value &uiProps, const jsi::Value &nativeProps) {
    NSSet *uiPropsSet = convertProps(rt, uiProps);
    NSSet *nativePropsSet = convertProps(rt, nativeProps);
    [reanimatedModule.nodesManager configureUiProps:uiPropsSet andNativeProps:nativePropsSet];
  };

  std::shared_ptr<LayoutAnimationsProxy> layoutAnimationsProxy =
      std::make_shared<LayoutAnimationsProxy>(notifyAboutProgress, notifyAboutEnd);
  std::weak_ptr<jsi::Runtime> wrt = animatedRuntime;
  [animationsManager setAnimationStartingBlock:^(
                         NSNumber *_Nonnull tag, NSString *type, NSDictionary *_Nonnull values, NSNumber *depth) {
    std::shared_ptr<jsi::Runtime> rt = wrt.lock();
    if (wrt.expired()) {
      return;
    }
    jsi::Object yogaValues(*rt);
    for (NSString *key in values.allKeys) {
      NSNumber *value = values[key];
      yogaValues.setProperty(*rt, [key UTF8String], [value doubleValue]);
    }

    jsi::Value layoutAnimationRepositoryAsValue =
        rt->global().getPropertyAsObject(*rt, "global").getProperty(*rt, "LayoutAnimationRepository");
    if (!layoutAnimationRepositoryAsValue.isUndefined()) {
      jsi::Function startAnimationForTag =
          layoutAnimationRepositoryAsValue.getObject(*rt).getPropertyAsFunction(*rt, "startAnimationForTag");
      startAnimationForTag.call(
          *rt,
          jsi::Value([tag intValue]),
          jsi::String::createFromAscii(*rt, std::string([type UTF8String])),
          yogaValues,
          jsi::Value([depth intValue]));
    }
  }];

  [animationsManager setRemovingConfigBlock:^(NSNumber *_Nonnull tag) {
    std::shared_ptr<jsi::Runtime> rt = wrt.lock();
    if (wrt.expired()) {
      return;
    }
    jsi::Value layoutAnimationRepositoryAsValue =
        rt->global().getPropertyAsObject(*rt, "global").getProperty(*rt, "LayoutAnimationRepository");
    if (!layoutAnimationRepositoryAsValue.isUndefined()) {
      jsi::Function removeConfig =
          layoutAnimationRepositoryAsValue.getObject(*rt).getPropertyAsFunction(*rt, "removeConfig");
      removeConfig.call(*rt, jsi::Value([tag intValue]));
    }
  }];

  // Layout Animations end

  // sensors
  ABI47_0_0ReanimatedSensorContainer *reanimatedSensorContainer = [[ABI47_0_0ReanimatedSensorContainer alloc] init];
  auto registerSensorFunction = [=](int sensorType, int interval, std::function<void(double[])> setter) -> int {
    return [reanimatedSensorContainer registerSensor:(ABI47_0_0ReanimatedSensorType)sensorType
                                            interval:interval
                                              setter:^(double *data) {
                                                setter(data);
                                              }];
  };

  auto unregisterSensorFunction = [=](int sensorId) { [reanimatedSensorContainer unregisterSensor:sensorId]; };
  // end sensors

  // keyboard events

  static ABI47_0_0REAKeyboardEventObserver *keyboardObserver = [[ABI47_0_0REAKeyboardEventObserver alloc] init];
  auto subscribeForKeyboardEventsFunction =
      [](std::function<void(int keyboardState, int height)> keyboardEventDataUpdater) {
        return [keyboardObserver subscribeForKeyboardEvents:^(int keyboardState, int height) {
          keyboardEventDataUpdater(keyboardState, height);
        }];
      };

  auto unsubscribeFromKeyboardEventsFunction = [](int listenerId) {
    [keyboardObserver unsubscribeFromKeyboardEvents:listenerId];
  };
  // end keyboard events

  PlatformDepMethodsHolder platformDepMethodsHolder = {
      requestRender,
      propUpdater,
      scrollToFunction,
      measuringFunction,
      getCurrentTime,
      registerSensorFunction,
      unregisterSensorFunction,
      setGestureStateFunction,
      configurePropsFunction,
      subscribeForKeyboardEventsFunction,
      unsubscribeFromKeyboardEventsFunction,
  };

  module = std::make_shared<NativeReanimatedModule>(
      jsInvoker,
      scheduler,
      animatedRuntime,
      errorHandler,
      propObtainer,
      layoutAnimationsProxy,
      platformDepMethodsHolder);

  scheduler->setRuntimeManager(module);

  [reanimatedModule.nodesManager registerEventHandler:^(NSString *eventName, id<ABI47_0_0RCTEvent> event) {
    std::string eventNameString([eventName UTF8String]);

    std::string eventAsString;
    try {
      eventAsString = folly::toJson(convertIdToFollyDynamic([event arguments][2]));
    } catch (std::exception &) {
      // Events from other libraries may contain NaN or INF values which cannot be represented in JSON.
      // See https://github.com/software-mansion/react-native-reanimated/issues/1776 for details.
      return;
    }

    eventAsString = "{ NativeMap:" + eventAsString + "}";
    jsi::Object global = module->runtime->global();
    jsi::String eventTimestampName = jsi::String::createFromAscii(*module->runtime, "_eventTimestamp");
    global.setProperty(*module->runtime, eventTimestampName, CACurrentMediaTime() * 1000);
    module->onEvent(eventNameString, eventAsString);
    global.setProperty(*module->runtime, eventTimestampName, jsi::Value::undefined());
  }];

  return module;
}

}
