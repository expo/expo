// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/WorkletRuntimeFactory.h>
#import <ExpoModulesCore/EXRuntime.h>
#import <ExpoModulesJSI/EXJavaScriptValue.h>

#if WORKLETS_ENABLED

#include <worklets/WorkletRuntime/WorkletRuntime.h>
#include <ExpoModulesCore/WorkletJSCallInvoker.h>

#endif

@implementation WorkletRuntimeFactory

+(nonnull EXRuntime *)createWorkletRuntime:(nonnull EXAppContext *)appContext fromPointer:(unsigned long)pointer
{
#if WORKLETS_ENABLED
  jsi::Runtime* jsRuntime = reinterpret_cast<jsi::Runtime *>(pointer);

  auto workletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);

  return [[EXRuntime alloc] initWithRuntime:*jsRuntime
                                callInvoker:std::make_shared<expo::WorkletJSCallInvoker>(workletRuntime)];
#else
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
#endif
}

+(unsigned long)extractRuntimePointer:(nonnull EXJavaScriptValue *)jsValue runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Value rawValue = [jsValue get];
  jsi::Runtime *rawRuntime = [runtime get];

  jsi::Object workletRuntimeObject = rawValue.getObject(*rawRuntime);
  if (!workletRuntimeObject.isArrayBuffer(*rawRuntime)) {
    return 0;
  }

  size_t pointerSize = sizeof(uintptr_t *);
  jsi::ArrayBuffer workletRuntimeArrayBuffer = workletRuntimeObject.getArrayBuffer(*rawRuntime);
  if (workletRuntimeArrayBuffer.size(*rawRuntime) != pointerSize) {
    return 0;
  }

  return *reinterpret_cast<uintptr_t *>(workletRuntimeArrayBuffer.data(*rawRuntime));
}

@end
