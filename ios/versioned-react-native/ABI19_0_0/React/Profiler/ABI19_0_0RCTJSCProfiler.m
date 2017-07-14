/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTJSCProfiler.h"

#import <UIKit/UIKit.h>

#import <ReactABI19_0_0/ABI19_0_0RCTLog.h>

#ifndef ABI19_0_0RCT_JSC_PROFILER
#define ABI19_0_0RCT_JSC_PROFILER ABI19_0_0RCT_PROFILE
#endif

#if ABI19_0_0RCT_JSC_PROFILER

#include <dlfcn.h>

#ifndef ABI19_0_0RCT_JSC_PROFILER_DYLIB
  #define ABI19_0_0RCT_JSC_PROFILER_DYLIB [[[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"ABI19_0_0RCTJSCProfiler.ios%zd", [[[UIDevice currentDevice] systemVersion] integerValue]] ofType:@"dylib" inDirectory:@"ABI19_0_0RCTJSCProfiler"] UTF8String]
#endif

static const char *const JSCProfileName = "profile";

typedef void (*JSCProfilerStartFunctionType)(JSContextRef, const char *);
typedef void (*JSCProfilerEndFunctionType)(JSContextRef, const char *, const char *);
typedef void (*JSCProfilerEnableFunctionType)(void);

static NSMutableDictionary<NSValue *, NSNumber *> *ABI19_0_0RCTJSCProfilerStateMap;

static JSCProfilerStartFunctionType ABI19_0_0RCTNativeProfilerStart  = NULL;
static JSCProfilerEndFunctionType ABI19_0_0RCTNativeProfilerEnd    = NULL;

NS_INLINE NSValue *ABI19_0_0RCTJSContextRefKey(JSContextRef ref) {
  return [NSValue valueWithPointer:ref];
}

static void ABI19_0_0RCTJSCProfilerStateInit()
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI19_0_0RCTJSCProfilerStateMap = [NSMutableDictionary new];

    void *JSCProfiler = dlopen(ABI19_0_0RCT_JSC_PROFILER_DYLIB, RTLD_NOW);

    ABI19_0_0RCTNativeProfilerStart = (JSCProfilerStartFunctionType)dlsym(JSCProfiler, "nativeProfilerStart");
    ABI19_0_0RCTNativeProfilerEnd =  (JSCProfilerEndFunctionType)dlsym(JSCProfiler, "nativeProfilerEnd");
    JSCProfilerEnableFunctionType enableBytecode = (__typeof__(enableBytecode))dlsym(JSCProfiler, "nativeProfilerEnableBytecode");

    if (ABI19_0_0RCTNativeProfilerStart && ABI19_0_0RCTNativeProfilerEnd && enableBytecode) {
      enableBytecode();
    } else {
      ABI19_0_0RCTNativeProfilerStart = NULL;
      ABI19_0_0RCTNativeProfilerEnd = NULL;
    }
  });
}

#endif

void ABI19_0_0RCTJSCProfilerStart(JSContextRef ctx)
{
#if ABI19_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    if (ABI19_0_0RCTJSCProfilerIsSupported()) {
      NSValue *key = ABI19_0_0RCTJSContextRefKey(ctx);
      BOOL isProfiling = [ABI19_0_0RCTJSCProfilerStateMap[key] boolValue];
      if (!isProfiling) {
        ABI19_0_0RCTLogInfo(@"Starting JSC profiler for context: %p", ctx);
        ABI19_0_0RCTJSCProfilerStateMap[key] = @YES;
        ABI19_0_0RCTNativeProfilerStart(ctx, JSCProfileName);
      } else {
        ABI19_0_0RCTLogWarn(@"Trying to start JSC profiler on a context which is already profiled.");
      }
    } else {
      ABI19_0_0RCTLogWarn(@"Cannot start JSC profiler as it's not supported.");
    }
  } else {
    ABI19_0_0RCTLogWarn(@"Trying to start JSC profiler for NULL context.");
  }
#endif
}

NSString *ABI19_0_0RCTJSCProfilerStop(JSContextRef ctx)
{
  NSString *outputFile = nil;
#if ABI19_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    ABI19_0_0RCTJSCProfilerStateInit();
    NSValue *key = ABI19_0_0RCTJSContextRefKey(ctx);
    BOOL isProfiling = [ABI19_0_0RCTJSCProfilerStateMap[key] boolValue];
    if (isProfiling) {
      NSString *filename = [NSString stringWithFormat:@"cpu_profile_%ld.json", (long)CFAbsoluteTimeGetCurrent()];
      outputFile = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
      if (ABI19_0_0RCTNativeProfilerEnd) {
        ABI19_0_0RCTNativeProfilerEnd(ctx, JSCProfileName, outputFile.UTF8String);
      }
      ABI19_0_0RCTLogInfo(@"Stopped JSC profiler for context: %p", ctx);
    } else {
      ABI19_0_0RCTLogWarn(@"Trying to stop JSC profiler on a context which is not being profiled.");
    }
    [ABI19_0_0RCTJSCProfilerStateMap removeObjectForKey:key];
  } else {
    ABI19_0_0RCTLogWarn(@"Trying to stop JSC profiler for NULL context.");
  }
#endif
  return outputFile;
}

BOOL ABI19_0_0RCTJSCProfilerIsProfiling(JSContextRef ctx)
{
  BOOL isProfiling = NO;
#if ABI19_0_0RCT_JSC_PROFILER
  if (ctx != NULL) {
    ABI19_0_0RCTJSCProfilerStateInit();
    isProfiling = [ABI19_0_0RCTJSCProfilerStateMap[ABI19_0_0RCTJSContextRefKey(ctx)] boolValue];
  }
#endif
  return isProfiling;
}

BOOL ABI19_0_0RCTJSCProfilerIsSupported(void)
{
  BOOL isSupported = NO;
#if ABI19_0_0RCT_JSC_PROFILER
  ABI19_0_0RCTJSCProfilerStateInit();
  isSupported = (ABI19_0_0RCTNativeProfilerStart != NULL);
#endif
  return isSupported;
}
