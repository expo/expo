/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI5_0_0RCTPerformanceLogger.h"
#import "ABI5_0_0RCTRootView.h"
#import "ABI5_0_0RCTLog.h"
#import "ABI5_0_0RCTProfile.h"

static int64_t ABI5_0_0RCTPLData[ABI5_0_0RCTPLSize][2] = {};
static NSUInteger ABI5_0_0RCTPLCookies[ABI5_0_0RCTPLSize] = {};

void ABI5_0_0RCTPerformanceLoggerStart(ABI5_0_0RCTPLTag tag)
{
  if (ABI5_0_0RCTProfileIsProfiling()) {
    NSString *label = ABI5_0_0RCTPerformanceLoggerLabels()[tag];
    ABI5_0_0RCTPLCookies[tag] = ABI5_0_0RCTProfileBeginAsyncEvent(0, label, nil);
  }

  ABI5_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
  ABI5_0_0RCTPLData[tag][1] = 0;
}

void ABI5_0_0RCTPerformanceLoggerEnd(ABI5_0_0RCTPLTag tag)
{
  if (ABI5_0_0RCTPLData[tag][0] != 0 && ABI5_0_0RCTPLData[tag][1] == 0) {
    ABI5_0_0RCTPLData[tag][1] = CACurrentMediaTime() * 1000;

    if (ABI5_0_0RCTProfileIsProfiling()) {
      NSString *label = ABI5_0_0RCTPerformanceLoggerLabels()[tag];
      ABI5_0_0RCTProfileEndAsyncEvent(0, @"native", ABI5_0_0RCTPLCookies[tag], label, @"ABI5_0_0RCTPerformanceLogger", nil);
    }
  } else {
    ABI5_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

void ABI5_0_0RCTPerformanceLoggerSet(ABI5_0_0RCTPLTag tag, int64_t value)
{
  ABI5_0_0RCTPLData[tag][0] = 0;
  ABI5_0_0RCTPLData[tag][1] = value;
}

void ABI5_0_0RCTPerformanceLoggerAdd(ABI5_0_0RCTPLTag tag, int64_t value)
{
  ABI5_0_0RCTPLData[tag][0] = 0;
  ABI5_0_0RCTPLData[tag][1] += value;
}

void ABI5_0_0RCTPerformanceLoggerAppendStart(ABI5_0_0RCTPLTag tag)
{
  ABI5_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
}

void ABI5_0_0RCTPerformanceLoggerAppendEnd(ABI5_0_0RCTPLTag tag)
{
  if (ABI5_0_0RCTPLData[tag][0] != 0) {
    ABI5_0_0RCTPLData[tag][1] += CACurrentMediaTime() * 1000 - ABI5_0_0RCTPLData[tag][0];
    ABI5_0_0RCTPLData[tag][0] = 0;
  } else {
    ABI5_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

NSArray<NSNumber *> *ABI5_0_0RCTPerformanceLoggerOutput(void)
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI5_0_0RCTPLSize; index++) {
    [result addObject:@(ABI5_0_0RCTPLData[index][0])];
    [result addObject:@(ABI5_0_0RCTPLData[index][1])];
  }
  return result;
}

NSArray *ABI5_0_0RCTPerformanceLoggerLabels(void)
{
  static NSArray *labels;
  static dispatch_once_t token;
  dispatch_once(&token, ^{
    labels = @[
      @"ScriptDownload",
      @"ScriptExecution",
      @"RAMBundleLoad",
      @"RAMStartupCodeSize",
      @"RAMNativeRequires",
      @"RAMNativeRequiresCount",
      @"RAMNativeRequiresSize",
      @"NativeModuleInit",
      @"NativeModuleMainThread",
      @"NativeModulePrepareConfig",
      @"NativeModuleInjectConfig",
      @"NativeModuleMainThreadUsesCount",
      @"JSCExecutorSetup",
      @"BridgeStartup",
      @"RootViewTTI",
      @"BundleSize",
    ];
  });
  return labels;
}

@interface ABI5_0_0RCTPerformanceLogger : NSObject <ABI5_0_0RCTBridgeModule>

@end

@implementation ABI5_0_0RCTPerformanceLogger

ABI5_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (void)setBridge:(ABI5_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sendTimespans)
                                               name:ABI5_0_0RCTContentDidAppearNotification
                                             object:nil];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)sendTimespans
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  [_bridge enqueueJSCall:@"PerformanceLogger.addTimespans" args:@[
    ABI5_0_0RCTPerformanceLoggerOutput(),
    ABI5_0_0RCTPerformanceLoggerLabels(),
  ]];
}

@end
