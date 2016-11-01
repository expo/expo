/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTJSCProfiler.h"

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTLog.h"

#ifndef ABI11_0_0RCT_JSC_PROFILER
#define ABI11_0_0RCT_JSC_PROFILER ABI11_0_0RCT_PROFILE
#endif

#if ABI11_0_0RCT_JSC_PROFILER

#include <dlfcn.h>

#ifndef ABI11_0_0RCT_JSC_PROFILER_DYLIB
  #define ABI11_0_0RCT_JSC_PROFILER_DYLIB [[[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"ABI11_0_0RCTJSCProfiler.ios%zd", [[[UIDevice currentDevice] systemVersion] integerValue]] ofType:@"dylib" inDirectory:@"ABI11_0_0RCTJSCProfiler"] UTF8String]
#endif

static const char *const JSCProfileName = "profile";

typedef void (*JSCProfilerStartFunctionType)(JSContextRef, const char *);
typedef void (*JSCProfilerEndFunctionType)(JSContextRef, const char *, const char *);
typedef void (*JSCProfilerEnableFunctionType)(void);

static NSMutableDictionary<NSValue *, NSNumber *> *ABI11_0_0RCTJSCProfilerStateMap;

static JSCProfilerStartFunctionType ABI11_0_0RCTNativeProfilerStart  = NULL;
static JSCProfilerEndFunctionType ABI11_0_0RCTNativeProfilerEnd    = NULL;

NS_INLINE NSValue *ABI11_0_0RCTJSContextRefKey(JSContextRef ref) {
  return [NSValue valueWithPointer:ref];
}

static void ABI11_0_0RCTJSCProfilerStateInit()
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI11_0_0RCTJSCProfilerStateMap = [NSMutableDictionary new];

    void *JSCProfiler = dlopen(ABI11_0_0RCT_JSC_PROFILER_DYLIB, RTLD_NOW);

    ABI11_0_0RCTNativeProfilerStart = (JSCProfilerStartFunctionType)dlsym(JSCProfiler, "nativeProfilerStart");
    ABI11_0_0RCTNativeProfilerEnd =  (JSCProfilerEndFunctionType)dlsym(JSCProfiler, "nativeProfilerEnd");
    JSCProfilerEnableFunctionType enableBytecode = (__typeof__(enableBytecode))dlsym(JSCProfiler, "nativeProfilerEnableBytecode");

    if (ABI11_0_0RCTNativeProfilerStart && ABI11_0_0RCTNativeProfilerEnd && enableBytecode) {
      enableBytecode();
    } else {
      ABI11_0_0RCTNativeProfilerStart = NULL;
      ABI11_0_0RCTNativeProfilerEnd = NULL;
    }
  });
}

#endif

void ABI11_0_0RCTJSCProfilerStart(JSContextRef ctx)
{
#if ABI11_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    if (ABI11_0_0RCTJSCProfilerIsSupported()) {
      NSValue *key = ABI11_0_0RCTJSContextRefKey(ctx);
      BOOL isProfiling = [ABI11_0_0RCTJSCProfilerStateMap[key] boolValue];
      if (!isProfiling) {
        ABI11_0_0RCTLogInfo(@"Starting JSC profiler for context: %p", ctx);
        ABI11_0_0RCTJSCProfilerStateMap[key] = @YES;
        ABI11_0_0RCTNativeProfilerStart(ctx, JSCProfileName);
      } else {
        ABI11_0_0RCTLogWarn(@"Trying to start JSC profiler on a context which is already profiled.");
      }
    } else {
      ABI11_0_0RCTLogWarn(@"Cannot start JSC profiler as it's not supported.");
    }
  } else {
    ABI11_0_0RCTLogWarn(@"Trying to start JSC profiler for NULL context.");
  }
#endif
}

NSString *ABI11_0_0RCTJSCProfilerStop(JSContextRef ctx)
{
  NSString *outputFile = nil;
#if ABI11_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    ABI11_0_0RCTJSCProfilerStateInit();
    NSValue *key = ABI11_0_0RCTJSContextRefKey(ctx);
    BOOL isProfiling = [ABI11_0_0RCTJSCProfilerStateMap[key] boolValue];
    if (isProfiling) {
      NSString *filename = [NSString stringWithFormat:@"cpu_profile_%ld.json", (long)CFAbsoluteTimeGetCurrent()];
      outputFile = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
      if (ABI11_0_0RCTNativeProfilerEnd) {
        ABI11_0_0RCTNativeProfilerEnd(ctx, JSCProfileName, outputFile.UTF8String);
      }
      ABI11_0_0RCTLogInfo(@"Stopped JSC profiler for context: %p", ctx);
    } else {
      ABI11_0_0RCTLogWarn(@"Trying to stop JSC profiler on a context which is not being profiled.");
    }
    [ABI11_0_0RCTJSCProfilerStateMap removeObjectForKey:key];
  } else {
    ABI11_0_0RCTLogWarn(@"Trying to stop JSC profiler for NULL context.");
  }
#endif
  return outputFile;
}

BOOL ABI11_0_0RCTJSCProfilerIsProfiling(JSContextRef ctx)
{
  BOOL isProfiling = NO;
#if ABI11_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    ABI11_0_0RCTJSCProfilerStateInit();
    isProfiling = [ABI11_0_0RCTJSCProfilerStateMap[ABI11_0_0RCTJSContextRefKey(ctx)] boolValue];
  }
#endif
  return isProfiling;
}

BOOL ABI11_0_0RCTJSCProfilerIsSupported(void)
{
  BOOL isSupported = NO;
#if ABI11_0_0RCT_JSC_PROFILER
  ABI11_0_0RCTJSCProfilerStateInit();
  isSupported = (ABI11_0_0RCTNativeProfilerStart != NULL);
#endif
  return isSupported;
}
