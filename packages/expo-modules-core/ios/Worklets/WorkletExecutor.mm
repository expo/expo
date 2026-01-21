// Copyright 2025-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/WorkletExecutor.h>

#if WORKLETS_ENABLED

#import "EXJavaScriptSerializable+Private.h"
#import <worklets/WorkletRuntime/WorkletRuntime.h>

@implementation EXWorkletExecutor

+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime
{
  auto workletRuntime = [runtime getWorkletRuntime];
  if (!workletRuntime) {
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
  if (!worklet) {
    return;
  }

  workletRuntime->schedule(worklet);
}

+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime
{
  auto workletRuntime = [runtime getWorkletRuntime];
  if (!workletRuntime) {
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
  if (!worklet) {
    return;
  }

  workletRuntime->runSync(worklet);
}

@end

#else

#import <ExpoModulesCore/EXJavaScriptSerializable.h>

@implementation EXWorkletExecutor

+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime
{
  @throw [NSException exceptionWithName:@"WorkletException"
                                 reason:@"Worklets integration is disabled"
                               userInfo:nil];
}

@end

#endif
