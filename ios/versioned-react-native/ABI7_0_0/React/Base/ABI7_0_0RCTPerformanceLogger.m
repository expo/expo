/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI7_0_0RCTPerformanceLogger.h"
#import "ABI7_0_0RCTRootView.h"
#import "ABI7_0_0RCTLog.h"
#import "ABI7_0_0RCTProfile.h"

static int64_t ABI7_0_0RCTPLData[ABI7_0_0RCTPLSize][2] = {};
static NSUInteger ABI7_0_0RCTPLCookies[ABI7_0_0RCTPLSize] = {};

void ABI7_0_0RCTPerformanceLoggerStart(ABI7_0_0RCTPLTag tag)
{
  if (ABI7_0_0RCTProfileIsProfiling()) {
    NSString *label = ABI7_0_0RCTPerformanceLoggerLabels()[tag];
    ABI7_0_0RCTPLCookies[tag] = ABI7_0_0RCTProfileBeginAsyncEvent(ABI7_0_0RCTProfileTagAlways, label, nil);
  }

  ABI7_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
  ABI7_0_0RCTPLData[tag][1] = 0;
}

void ABI7_0_0RCTPerformanceLoggerEnd(ABI7_0_0RCTPLTag tag)
{
  if (ABI7_0_0RCTPLData[tag][0] != 0 && ABI7_0_0RCTPLData[tag][1] == 0) {
    ABI7_0_0RCTPLData[tag][1] = CACurrentMediaTime() * 1000;

    if (ABI7_0_0RCTProfileIsProfiling()) {
      NSString *label = ABI7_0_0RCTPerformanceLoggerLabels()[tag];
      ABI7_0_0RCTProfileEndAsyncEvent(ABI7_0_0RCTProfileTagAlways, @"native", ABI7_0_0RCTPLCookies[tag], label, @"ABI7_0_0RCTPerformanceLogger", nil);
    }
  } else {
    ABI7_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

void ABI7_0_0RCTPerformanceLoggerSet(ABI7_0_0RCTPLTag tag, int64_t value)
{
  ABI7_0_0RCTPLData[tag][0] = 0;
  ABI7_0_0RCTPLData[tag][1] = value;
}

void ABI7_0_0RCTPerformanceLoggerAdd(ABI7_0_0RCTPLTag tag, int64_t value)
{
  ABI7_0_0RCTPLData[tag][0] = 0;
  ABI7_0_0RCTPLData[tag][1] += value;
}

void ABI7_0_0RCTPerformanceLoggerAppendStart(ABI7_0_0RCTPLTag tag)
{
  ABI7_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
}

void ABI7_0_0RCTPerformanceLoggerAppendEnd(ABI7_0_0RCTPLTag tag)
{
  if (ABI7_0_0RCTPLData[tag][0] != 0) {
    ABI7_0_0RCTPLData[tag][1] += CACurrentMediaTime() * 1000 - ABI7_0_0RCTPLData[tag][0];
    ABI7_0_0RCTPLData[tag][0] = 0;
  } else {
    ABI7_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

NSArray<NSNumber *> *ABI7_0_0RCTPerformanceLoggerOutput(void)
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI7_0_0RCTPLSize; index++) {
    [result addObject:@(ABI7_0_0RCTPLData[index][0])];
    [result addObject:@(ABI7_0_0RCTPLData[index][1])];
  }
  return result;
}

NSArray *ABI7_0_0RCTPerformanceLoggerLabels(void)
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

@interface ABI7_0_0RCTPerformanceLogger : NSObject <ABI7_0_0RCTBridgeModule>

@end

@implementation ABI7_0_0RCTPerformanceLogger

ABI7_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
}

- (void)setBridge:(ABI7_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sendTimespans)
                                               name:ABI7_0_0RCTContentDidAppearNotification
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
    ABI7_0_0RCTPerformanceLoggerOutput(),
    ABI7_0_0RCTPerformanceLoggerLabels(),
  ]];
}

@end
