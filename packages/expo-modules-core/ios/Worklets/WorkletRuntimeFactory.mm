// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesWorklets/WorkletRuntimeFactory.h>

#if WORKLETS_ENABLED

#include <worklets/WorkletRuntime/WorkletRuntime.h>
#include <ExpoModulesWorklets/WorkletJSCallInvoker.h>

#endif

@implementation WorkletRuntimeFactory

+ (nonnull EXWorkletRuntime *)createWorkletRuntime:(nonnull EXAppContext *)appContext fromPointer:(nullable void *)pointer
{
#if WORKLETS_ENABLED
  jsi::Runtime* jsRuntime = reinterpret_cast<jsi::Runtime *>(pointer);

  auto weakWorkletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);
  auto workletRuntime = weakWorkletRuntime.lock();

  return [[EXWorkletRuntime alloc] initWithWorkletRuntime:workletRuntime
                                              callInvoker:std::make_shared<expo::WorkletJSCallInvoker>(weakWorkletRuntime)];
#else
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
#endif
}

+ (nullable void *)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Value rawValue = [jsValue get];
  jsi::Runtime *rawRuntime = [runtime get];

  jsi::Object workletRuntimeObject = rawValue.getObject(*rawRuntime);
  if (!workletRuntimeObject.isArrayBuffer(*rawRuntime)) {
    return NULL;
  }

  size_t pointerSize = sizeof(uintptr_t *);
  jsi::ArrayBuffer workletRuntimeArrayBuffer = workletRuntimeObject.getArrayBuffer(*rawRuntime);
  if (workletRuntimeArrayBuffer.size(*rawRuntime) != pointerSize) {
    return NULL;
  }

  return *reinterpret_cast<uintptr_t **>(workletRuntimeArrayBuffer.data(*rawRuntime));
}

@end
