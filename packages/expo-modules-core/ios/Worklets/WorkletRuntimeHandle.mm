// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/WorkletRuntimeHandle.h>

#if WORKLETS_ENABLED

#import "EXJavaScriptSerializable+Private.h"
#import <ExpoModulesCore/EXJSIConversions.h>
#import <worklets/WorkletRuntime/WorkletRuntime.h>

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

@end

#endif
