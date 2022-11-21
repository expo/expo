#import "DevMenuLayoutAnimationsProxy.h"
#import "NativeMethods.h"
#import "NativeProxy.h"
#import "DevMenuREAAnimationsManager.h"
#import "DevMenuREAIOSErrorHandler.h"
#import "DevMenuREAIOSScheduler.h"
#import "DevMenuREAKeyboardEventObserver.h"
#import "DevMenuREAModule.h"
#import "DevMenuREANodesManager.h"
#import "DevMenuREAUIManager.h"
#import "DevMenuRNGestureHandlerStateManager.h"
#import "DevMenuReanimatedSensorContainer.h"
#import <React/RCTFollyConvert.h>
#import <React/RCTUIManager.h>
#import <folly/json.h>

#if TARGET_IPHONE_SIMULATOR
#import <dlfcn.h>
#endif

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#elif __has_include(<hermes/hermes.h>)
#import <hermes/hermes.h>
#else
#import <jsi/JSCRuntime.h>
#endif

namespace devmenureanimated {

using namespace facebook;
using namespace react;

static CGFloat DevMenuSimAnimationDragCoefficient(void)
{
  static float (*DevMenuUIAnimationDragCoefficient)(void) = NULL;
#if TARGET_IPHONE_SIMULATOR
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
      DevMenuUIAnimationDragCoefficient = (float (*)(void))dlsym(RTLD_DEFAULT, "UIAnimationDragCoefficient");
  });
#endif
  return DevMenuUIAnimationDragCoefficient ? DevMenuUIAnimationDragCoefficient() : 1.f;
}

static CFTimeInterval calculateTimestampWithSlowAnimations(CFTimeInterval currentTimestamp)
{
#if TARGET_IPHONE_SIMULATOR
  static CFTimeInterval dragCoefChangedTimestamp = CACurrentMediaTime();
  static CGFloat previousDragCoef = DevMenuSimAnimationDragCoefficient();

  const CGFloat dragCoef = DevMenuSimAnimationDragCoefficient();
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

// COPIED FROM RCTTurboModule.mm
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

std::shared_ptr<NativeReanimatedModule> createDevMenuReanimatedModule(
    RCTBridge *bridge,
    std::shared_ptr<CallInvoker> jsInvoker)
{
  DevMenuREAModule *reanimatedModule = [bridge moduleForClass:[DevMenuREAModule class]];

  auto propUpdater = [reanimatedModule](
                         jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &props) -> void {
    NSString *nsViewName = [NSString stringWithCString:viewName.asString(rt).utf8(rt).c_str()
                                              encoding:[NSString defaultCStringEncoding]];

    NSDictionary *propsDict = convertJSIObjectToNSDictionary(rt, props);
    [reanimatedModule.nodesManager updateProps:propsDict
                                 ofViewWithTag:[NSNumber numberWithInt:viewTag]
                                      withName:nsViewName];
  };

  RCTUIManager *uiManager = reanimatedModule.nodesManager.uiManager;
  auto measuringFunction = [uiManager](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag, uiManager);
  };

  auto scrollToFunction = [uiManager](int viewTag, double x, double y, bool animated) {
    scrollTo(viewTag, uiManager, x, y, animated);
  };

  id<DevMenuRNGestureHandlerStateManager> gestureHandlerStateManager = nil;
  auto setGestureStateFunction = [gestureHandlerStateManager, bridge](int handlerTag, int newState) mutable {
    if (gestureHandlerStateManager == nil) {
      gestureHandlerStateManager = [bridge moduleForName:@"RNGestureHandlerModule"];
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

#if __has_include(<reacthermes/HermesExecutorFactory.h>)
  std::shared_ptr<jsi::Runtime> animatedRuntime = facebook::hermes::makeHermesRuntime();
#elif __has_include(<hermes/hermes.h>)
  std::shared_ptr<jsi::Runtime> animatedRuntime = facebook::hermes::makeHermesRuntime();
#else
  std::shared_ptr<jsi::Runtime> animatedRuntime = facebook::jsc::makeJSCRuntime();
#endif

  std::shared_ptr<Scheduler> scheduler = std::make_shared<DevMenuREAIOSScheduler>(jsInvoker);
  std::shared_ptr<ErrorHandler> errorHandler = std::make_shared<DevMenuREAIOSErrorHandler>(scheduler);
  std::shared_ptr<NativeReanimatedModule> module;

  __block std::weak_ptr<Scheduler> weakScheduler = scheduler;
  ((DevMenuREAUIManager *)uiManager).flushUiOperations = ^void() {
    std::shared_ptr<Scheduler> scheduler = weakScheduler.lock();
    if (scheduler != nullptr) {
      scheduler->triggerUI();
    }
  };

  auto requestRender = [reanimatedModule, &module](std::function<void(double)> onRender, jsi::Runtime &rt) {
    [reanimatedModule.nodesManager postOnAnimation:^(CADisplayLink *displayLink) {
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
  DevMenuREAUIManager *reaUiManagerNoCast = [bridge moduleForClass:[DevMenuREAUIManager class]];
  RCTUIManager *reaUiManager = reaUiManagerNoCast;
  DevMenuREAAnimationsManager *animationsManager = [[DevMenuREAAnimationsManager alloc] initWithUIManager:reaUiManager];
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
  DevMenuReanimatedSensorContainer *reanimatedSensorContainer = [[DevMenuReanimatedSensorContainer alloc] init];
  auto registerSensorFunction = [=](int sensorType, int interval, std::function<void(double[])> setter) -> int {
    return [reanimatedSensorContainer registerSensor:(DevMenuReanimatedSensorType)sensorType
                                            interval:interval
                                              setter:^(double *data) {
                                                setter(data);
                                              }];
  };

  auto unregisterSensorFunction = [=](int sensorId) { [reanimatedSensorContainer unregisterSensor:sensorId]; };
  // end sensors

  // keyboard events

  static DevMenuREAKeyboardEventObserver *keyboardObserver = [[DevMenuREAKeyboardEventObserver alloc] init];
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

  [reanimatedModule.nodesManager registerEventHandler:^(NSString *eventName, id<RCTEvent> event) {
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
