
#import <ABI44_0_0React/ABI44_0_0RCTFollyConvert.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import <folly/json.h>

#import "LayoutAnimationsProxy.h"
#import "NativeMethods.h"
#import "NativeProxy.h"
#import "ABI44_0_0REAAnimationsManager.h"
#import "ABI44_0_0REAIOSErrorHandler.h"
#import "ABI44_0_0REAIOSScheduler.h"
#import "ABI44_0_0REAModule.h"
#import "ABI44_0_0REANodesManager.h"
#import "ABI44_0_0REAUIManager.h"
#import "ABI44_0_0RNGestureHandlerStateManager.h"

#if __has_include(<reacthermes/ABI44_0_0HermesExecutorFactory.h>)
#import <reacthermes/ABI44_0_0HermesExecutorFactory.h>
#elif __has_include(<hermes/hermes.h>)
#import <hermes/hermes.h>
#else
#import <ABI44_0_0jsi/ABI44_0_0JSCRuntime.h>
#endif

namespace ABI44_0_0reanimated {

using namespace ABI44_0_0facebook;
using namespace ABI44_0_0React;

// COPIED FROM ABI44_0_0RCTTurboModule.mm
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

std::shared_ptr<NativeReanimatedModule> createReanimatedModule(
    ABI44_0_0RCTBridge *bridge,
    std::shared_ptr<CallInvoker> jsInvoker)
{
  ABI44_0_0REAModule *reanimatedModule = [bridge moduleForClass:[ABI44_0_0REAModule class]];

  auto propUpdater = [reanimatedModule](
                         jsi::Runtime &rt, int viewTag, const jsi::Value &viewName, const jsi::Object &props) -> void {
    NSString *nsViewName = [NSString stringWithCString:viewName.asString(rt).utf8(rt).c_str()
                                              encoding:[NSString defaultCStringEncoding]];

    NSDictionary *propsDict = convertJSIObjectToNSDictionary(rt, props);
    [reanimatedModule.nodesManager updateProps:propsDict
                                 ofViewWithTag:[NSNumber numberWithInt:viewTag]
                                      withName:nsViewName];
  };

  ABI44_0_0RCTUIManager *uiManager = reanimatedModule.nodesManager.uiManager;
  auto measuringFunction = [uiManager](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag, uiManager);
  };

  auto scrollToFunction = [uiManager](int viewTag, double x, double y, bool animated) {
    scrollTo(viewTag, uiManager, x, y, animated);
  };

  id<ABI44_0_0RNGestureHandlerStateManager> gestureHandlerStateManager = [bridge moduleForName:@"ABI44_0_0RNGestureHandlerModule"];
  auto setGestureStateFunction = [gestureHandlerStateManager](int handlerTag, int newState) {
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

#if __has_include(<reacthermes/ABI44_0_0HermesExecutorFactory.h>)
  std::shared_ptr<jsi::Runtime> animatedRuntime = ABI44_0_0facebook::hermes::makeHermesRuntime();
#elif __has_include(<hermes/hermes.h>)
  std::shared_ptr<jsi::Runtime> animatedRuntime = ABI44_0_0facebook::hermes::makeHermesRuntime();
#else
  std::shared_ptr<jsi::Runtime> animatedRuntime = ABI44_0_0facebook::jsc::makeJSCRuntime();
#endif

  std::shared_ptr<Scheduler> scheduler = std::make_shared<ABI44_0_0REAIOSScheduler>(jsInvoker);
  std::shared_ptr<ErrorHandler> errorHandler = std::make_shared<ABI44_0_0REAIOSErrorHandler>(scheduler);
  std::shared_ptr<NativeReanimatedModule> module;

  __block std::weak_ptr<Scheduler> weakScheduler = scheduler;
  ((ABI44_0_0REAUIManager *)uiManager).flushUiOperations = ^void() {
    std::shared_ptr<Scheduler> scheduler = weakScheduler.lock();
    if (scheduler != nullptr) {
      scheduler->triggerUI();
    }
  };

  auto requestRender = [reanimatedModule, &module](std::function<void(double)> onRender, jsi::Runtime &rt) {
    [reanimatedModule.nodesManager postOnAnimation:^(CADisplayLink *displayLink) {
      double frameTimestamp = displayLink.targetTimestamp * 1000;
      jsi::Object global = rt.global();
      jsi::String frameTimestampName = jsi::String::createFromAscii(rt, "_frameTimestamp");
      global.setProperty(rt, frameTimestampName, frameTimestamp);
      onRender(frameTimestamp);
      global.setProperty(rt, frameTimestampName, jsi::Value::undefined());
    }];
  };

  auto getCurrentTime = []() { return CACurrentMediaTime() * 1000; };

  // Layout Animations start
  ABI44_0_0REAUIManager *reaUiManagerNoCast = [bridge moduleForClass:[ABI44_0_0REAUIManager class]];
  ABI44_0_0RCTUIManager *reaUiManager = reaUiManagerNoCast;
  ABI44_0_0REAAnimationsManager *animationsManager = [[ABI44_0_0REAAnimationsManager alloc] initWithUIManager:reaUiManager];
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

  PlatformDepMethodsHolder platformDepMethodsHolder = {
      requestRender,
      propUpdater,
      scrollToFunction,
      measuringFunction,
      getCurrentTime,
      setGestureStateFunction,
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

  [reanimatedModule.nodesManager registerEventHandler:^(NSString *eventName, id<ABI44_0_0RCTEvent> event) {
    std::string eventNameString([eventName UTF8String]);
    std::string eventAsString = folly::toJson(convertIdToFollyDynamic([event arguments][2]));

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
