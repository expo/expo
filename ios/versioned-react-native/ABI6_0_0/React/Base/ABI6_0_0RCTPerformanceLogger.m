/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI6_0_0RCTPerformanceLogger.h"
#import "ABI6_0_0RCTRootView.h"
#import "ABI6_0_0RCTLog.h"
#import "ABI6_0_0RCTProfile.h"

static int64_t ABI6_0_0RCTPLData[ABI6_0_0RCTPLSize][2] = {};
static NSUInteger ABI6_0_0RCTPLCookies[ABI6_0_0RCTPLSize] = {};

void ABI6_0_0RCTPerformanceLoggerStart(ABI6_0_0RCTPLTag tag)
{
  if (ABI6_0_0RCTProfileIsProfiling()) {
    NSString *label = ABI6_0_0RCTPerformanceLoggerLabels()[tag];
    ABI6_0_0RCTPLCookies[tag] = ABI6_0_0RCTProfileBeginAsyncEvent(ABI6_0_0RCTProfileTagAlways, label, nil);
  }

  ABI6_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
  ABI6_0_0RCTPLData[tag][1] = 0;
}

void ABI6_0_0RCTPerformanceLoggerEnd(ABI6_0_0RCTPLTag tag)
{
  if (ABI6_0_0RCTPLData[tag][0] != 0 && ABI6_0_0RCTPLData[tag][1] == 0) {
    ABI6_0_0RCTPLData[tag][1] = CACurrentMediaTime() * 1000;

    if (ABI6_0_0RCTProfileIsProfiling()) {
      NSString *label = ABI6_0_0RCTPerformanceLoggerLabels()[tag];
      ABI6_0_0RCTProfileEndAsyncEvent(ABI6_0_0RCTProfileTagAlways, @"native", ABI6_0_0RCTPLCookies[tag], label, @"ABI6_0_0RCTPerformanceLogger", nil);
    }
  } else {
    ABI6_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

void ABI6_0_0RCTPerformanceLoggerSet(ABI6_0_0RCTPLTag tag, int64_t value)
{
  ABI6_0_0RCTPLData[tag][0] = 0;
  ABI6_0_0RCTPLData[tag][1] = value;
}

void ABI6_0_0RCTPerformanceLoggerAdd(ABI6_0_0RCTPLTag tag, int64_t value)
{
  ABI6_0_0RCTPLData[tag][0] = 0;
  ABI6_0_0RCTPLData[tag][1] += value;
}

void ABI6_0_0RCTPerformanceLoggerAppendStart(ABI6_0_0RCTPLTag tag)
{
  ABI6_0_0RCTPLData[tag][0] = CACurrentMediaTime() * 1000;
}

void ABI6_0_0RCTPerformanceLoggerAppendEnd(ABI6_0_0RCTPLTag tag)
{
  if (ABI6_0_0RCTPLData[tag][0] != 0) {
    ABI6_0_0RCTPLData[tag][1] += CACurrentMediaTime() * 1000 - ABI6_0_0RCTPLData[tag][0];
    ABI6_0_0RCTPLData[tag][0] = 0;
  } else {
    ABI6_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

NSArray<NSNumber *> *ABI6_0_0RCTPerformanceLoggerOutput(void)
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI6_0_0RCTPLSize; index++) {
    [result addObject:@(ABI6_0_0RCTPLData[index][0])];
    [result addObject:@(ABI6_0_0RCTPLData[index][1])];
  }
  return result;
}

NSArray *ABI6_0_0RCTPerformanceLoggerLabels(void)
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

@interface ABI6_0_0RCTPerformanceLogger : NSObject <ABI6_0_0RCTBridgeModule>

@end

@implementation ABI6_0_0RCTPerformanceLogger

ABI6_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
}

- (void)setBridge:(ABI6_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(sendTimespans)
                                               name:ABI6_0_0RCTContentDidAppearNotification
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
    ABI6_0_0RCTPerformanceLoggerOutput(),
    ABI6_0_0RCTPerformanceLoggerLabels(),
  ]];
}

@end
