// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/WorkletRuntimeHandle.h>

#if WORKLETS_ENABLED

#import "EXJavaScriptSerializable+Private.h"
#import <ExpoModulesCore/EXJSIConversions.h>
#import <worklets/WorkletRuntime/WorkletRuntime.h>

namespace {
// Minimal JSI -> ObjC converter for sync worklet return values. Covers the JSON-shaped
// subset needed by the current `executeWorkletReturning` use sites (descriptors, plain
// data). Functions and host objects are not converted.
id convertJSIValueToObjC(jsi::Runtime &rt, const jsi::Value &value) {
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
    return [NSString stringWithUTF8String:value.getString(rt).utf8(rt).c_str()];
  }
  if (value.isObject()) {
    auto obj = value.getObject(rt);
    if (obj.isArray(rt)) {
      auto array = obj.getArray(rt);
      size_t length = array.size(rt);
      NSMutableArray *result = [NSMutableArray arrayWithCapacity:length];
      for (size_t i = 0; i < length; i++) {
        id element = convertJSIValueToObjC(rt, array.getValueAtIndex(rt, i));
        [result addObject:(element ?: [NSNull null])];
      }
      return result;
    }
    auto names = obj.getPropertyNames(rt);
    size_t length = names.size(rt);
    NSMutableDictionary *result = [NSMutableDictionary dictionaryWithCapacity:length];
    for (size_t i = 0; i < length; i++) {
      auto key = names.getValueAtIndex(rt, i).getString(rt).utf8(rt);
      id converted = convertJSIValueToObjC(rt, obj.getProperty(rt, key.c_str()));
      if (converted) {
        result[[NSString stringWithUTF8String:key.c_str()]] = converted;
      }
    }
    return result;
  }
  return nil;
}
}

@implementation EXWorkletRuntimeHandle {
  std::weak_ptr<worklets::WorkletRuntime> _workletRuntime;
  jsi::Runtime *_jsiRuntime;
}

- (nullable instancetype)initWithRawPointer:(void *)pointer
{
  if (self = [super init]) {
    _jsiRuntime = reinterpret_cast<jsi::Runtime *>(pointer);

    auto weakRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*_jsiRuntime);
    auto locked = weakRuntime.lock();
    if (!locked) {
      NSLog(@"[ExpoModulesWorklets] Warning: Cannot create WorkletRuntimeHandle; the jsi::Runtime is not associated with a live worklet runtime");
      return nil;
    }
    _workletRuntime = weakRuntime;
  }
  return self;
}

#pragma mark - Schedule (async)

- (void)scheduleWorklet:(EXJavaScriptSerializable *)serializable
              arguments:(NSArray *)arguments
{
  auto workletRuntime = _workletRuntime.lock();
  if (!workletRuntime) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot schedule worklet; the worklet runtime has been destroyed");
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    [serializable getSerializable]
  );
  if (!worklet) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot schedule worklet; the given serializable is not a worklet");
    return;
  }

  workletRuntime->schedule([worklet, arguments](jsi::Runtime &rt) {
    std::vector<jsi::Value> convertedArgs;
    convertedArgs.reserve(arguments.count);
    for (id arg in arguments) {
      convertedArgs.emplace_back(expo::convertObjCObjectToJSIValue(rt, arg));
    }
    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
  });
}

#pragma mark - Execute (sync)

- (void)executeWorklet:(EXJavaScriptSerializable *)serializable
             arguments:(NSArray *)arguments
{
  auto workletRuntime = _workletRuntime.lock();
  if (!workletRuntime) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the worklet runtime has been destroyed");
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    [serializable getSerializable]
  );
  if (!worklet) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the given serializable is not a worklet");
    return;
  }

  workletRuntime->executeSync([worklet, arguments](jsi::Runtime &rt) -> jsi::Value {
    std::vector<jsi::Value> convertedArgs;
    convertedArgs.reserve(arguments.count);
    for (id arg in arguments) {
      convertedArgs.emplace_back(expo::convertObjCObjectToJSIValue(rt, arg));
    }
    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    return func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
  });
}

#pragma mark - Execute (sync, returning)

- (nullable id)executeWorkletReturning:(EXJavaScriptSerializable *)serializable
                              arguments:(NSArray *)arguments
{
  auto workletRuntime = _workletRuntime.lock();
  if (!workletRuntime) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the worklet runtime has been destroyed");
    return nil;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    [serializable getSerializable]
  );
  if (!worklet) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the given serializable is not a worklet");
    return nil;
  }

  id result = nil;
  workletRuntime->executeSync([worklet, arguments, &result](jsi::Runtime &rt) -> jsi::Value {
    std::vector<jsi::Value> convertedArgs;
    convertedArgs.reserve(arguments.count);
    for (id arg in arguments) {
      convertedArgs.emplace_back(expo::convertObjCObjectToJSIValue(rt, arg));
    }
    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    auto value = func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
    result = convertJSIValueToObjC(rt, value);
    return value;
  });
  return result;
}

@end

#else

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>

@implementation EXWorkletRuntimeHandle

- (nullable instancetype)initWithRawPointer:(void *)pointer
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

- (void)scheduleWorklet:(EXJavaScriptSerializable *)serializable
              arguments:(NSArray *)arguments
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

- (void)executeWorklet:(EXJavaScriptSerializable *)serializable
             arguments:(NSArray *)arguments
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

- (nullable id)executeWorkletReturning:(EXJavaScriptSerializable *)serializable
                              arguments:(NSArray *)arguments
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

@end

#endif
