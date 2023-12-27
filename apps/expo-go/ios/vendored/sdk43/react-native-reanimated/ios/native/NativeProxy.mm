#import "NativeProxy.h"
#import "ABI43_0_0REAIOSScheduler.h"
#import "ABI43_0_0REAIOSErrorHandler.h"
#import "ABI43_0_0REAModule.h"
#import "ABI43_0_0REANodesManager.h"
#import "NativeMethods.h"
#import <folly/json.h>
#import <ABI43_0_0React/ABI43_0_0RCTFollyConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>

#if __has_include(<hermes/hermes.h>)
#import <hermes/hermes.h>
#else
#import <ABI43_0_0jsi/ABI43_0_0JSCRuntime.h>
#endif

namespace ABI43_0_0reanimated {

using namespace ABI43_0_0facebook;
using namespace ABI43_0_0React;


// COPIED FROM ABI43_0_0RCTTurboModule.mm
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

static NSArray *
convertJSIArrayToNSArray(jsi::Runtime &runtime, const jsi::Array &value)
{
  size_t size = value.size(runtime);
  NSMutableArray *result = [NSMutableArray new];
  for (size_t i = 0; i < size; i++) {
    // Insert kCFNull when it's `undefined` value to preserve the indices.
    [result
        addObject:convertJSIValueToObjCObject(runtime, value.getValueAtIndex(runtime, i)) ?: (id)kCFNull];
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

std::shared_ptr<NativeReanimatedModule> createReanimatedModule(std::shared_ptr<CallInvoker> jsInvoker) {
  ABI43_0_0RCTBridge *bridge = ABI43_0_0_bridge_reanimated;
  ABI43_0_0REAModule *reanimatedModule = [bridge moduleForClass:[ABI43_0_0REAModule class]];

  auto propUpdater = [reanimatedModule](jsi::Runtime &rt, int viewTag, const jsi::Value& viewName, const jsi::Object &props) -> void {
    NSString *nsViewName = [NSString stringWithCString:viewName.asString(rt).utf8(rt).c_str() encoding:[NSString defaultCStringEncoding]];

    NSDictionary *propsDict = convertJSIObjectToNSDictionary(rt, props);
    [reanimatedModule.nodesManager updateProps:propsDict ofViewWithTag:[NSNumber numberWithInt:viewTag] withName:nsViewName];
  };


  ABI43_0_0RCTUIManager *uiManager = reanimatedModule.nodesManager.uiManager;
  auto measuringFunction = [uiManager](int viewTag) -> std::vector<std::pair<std::string, double>> {
    return measure(viewTag, uiManager);
  };

  auto scrollToFunction = [uiManager](int viewTag, double x, double y, bool animated) {
    scrollTo(viewTag, uiManager, x, y, animated);
  };

  auto propObtainer = [reanimatedModule](jsi::Runtime &rt, const int viewTag, const jsi::String &propName) -> jsi::Value {
    NSString* propNameConverted = [NSString stringWithFormat:@"%s",propName.utf8(rt).c_str()];
      std::string resultStr = std::string([[reanimatedModule.nodesManager obtainProp:[NSNumber numberWithInt:viewTag] propName:propNameConverted] UTF8String]);
      jsi::Value val = jsi::String::createFromUtf8(rt, resultStr);
      return val;
  };


#if __has_include(<hermes/hermes.h>)
  std::unique_ptr<jsi::Runtime> animatedRuntime = ABI43_0_0facebook::hermes::makeHermesRuntime();
#else
  std::unique_ptr<jsi::Runtime> animatedRuntime = ABI43_0_0facebook::jsc::makeJSCRuntime();
#endif

  std::shared_ptr<Scheduler> scheduler = std::make_shared<ABI43_0_0REAIOSScheduler>(jsInvoker);
  std::shared_ptr<ErrorHandler> errorHandler = std::make_shared<ABI43_0_0REAIOSErrorHandler>(scheduler);
  std::shared_ptr<NativeReanimatedModule> module;

  auto requestRender = [reanimatedModule, &module](std::function<void(double)> onRender, jsi::Runtime &rt) {
    [reanimatedModule.nodesManager postOnAnimation:^(CADisplayLink *displayLink) {
      double frameTimestamp = displayLink.targetTimestamp * 1000;
      rt.global().setProperty(rt, "_frameTimestamp", frameTimestamp);
      onRender(frameTimestamp);
      rt.global().setProperty(rt, "_frameTimestamp", jsi::Value::undefined());
    }];
  };

  auto getCurrentTime = []() {
    return CACurrentMediaTime() * 1000;
  };

  PlatformDepMethodsHolder platformDepMethodsHolder = {
    requestRender,
    propUpdater,
    scrollToFunction,
    measuringFunction,
    getCurrentTime,
  };

  module = std::make_shared<NativeReanimatedModule>(jsInvoker,
                                                    scheduler,
                                                    std::move(animatedRuntime),
                                                    errorHandler,
                                                    propObtainer,
                                                    platformDepMethodsHolder
                                                    );

  scheduler->setRuntimeManager(module);

  [reanimatedModule.nodesManager registerEventHandler:^(NSString *eventName, id<ABI43_0_0RCTEvent> event) {
    std::string eventNameString([eventName UTF8String]);
    std::string eventAsString = folly::toJson(convertIdToFollyDynamic([event arguments][2]));

    eventAsString = "{ NativeMap:"  + eventAsString + "}";
    module->runtime->global().setProperty(*module->runtime, "_eventTimestamp", CACurrentMediaTime() * 1000);
    module->onEvent(eventNameString, eventAsString);
    module->runtime->global().setProperty(*module->runtime, "_eventTimestamp", jsi::Value::undefined());
  }];

  return module;
}

}
