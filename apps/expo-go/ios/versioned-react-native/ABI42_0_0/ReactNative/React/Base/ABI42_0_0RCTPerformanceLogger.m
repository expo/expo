/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI42_0_0RCTLog.h"
#import "ABI42_0_0RCTPerformanceLogger.h"
#import "ABI42_0_0RCTProfile.h"
#import "ABI42_0_0RCTRootView.h"

@interface ABI42_0_0RCTPerformanceLogger () {
  int64_t _data[ABI42_0_0RCTPLSize][2];
  NSUInteger _cookies[ABI42_0_0RCTPLSize];
}

@property (nonatomic, copy) NSArray<NSString *> *labelsForTags;

@end

@implementation ABI42_0_0RCTPerformanceLogger

- (instancetype)init
{
  if (self = [super init]) {
    // Keep this in sync with ABI42_0_0RCTPLTag
    _labelsForTags = @[
      @"ScriptDownload",
      @"ScriptExecution",
      @"RAMBundleLoad",
      @"RAMStartupCodeSize",
      @"RAMStartupNativeRequires",
      @"RAMStartupNativeRequiresCount",
      @"RAMNativeRequires",
      @"RAMNativeRequiresCount",
      @"NativeModuleInit",
      @"NativeModuleMainThread",
      @"NativeModulePrepareConfig",
      @"NativeModuleMainThreadUsesCount",
      @"NativeModuleSetup",
      @"TurboModuleSetup",
      @"JSCWrapperOpenLibrary",
      @"BridgeStartup",
      @"RootViewTTI",
      @"BundleSize",
    ];
  }
  return self;
}

- (void)markStartForTag:(ABI42_0_0RCTPLTag)tag
{
#if ABI42_0_0RCT_PROFILE
  if (ABI42_0_0RCTProfileIsProfiling()) {
    NSString *label = _labelsForTags[tag];
    _cookies[tag] = ABI42_0_0RCTProfileBeginAsyncEvent(ABI42_0_0RCTProfileTagAlways, label, nil);
  }
#endif
  _data[tag][0] = CACurrentMediaTime() * 1000;
  _data[tag][1] = 0;
}

- (void)markStopForTag:(ABI42_0_0RCTPLTag)tag
{
#if ABI42_0_0RCT_PROFILE
  if (ABI42_0_0RCTProfileIsProfiling()) {
    NSString *label = _labelsForTags[tag];
    ABI42_0_0RCTProfileEndAsyncEvent(ABI42_0_0RCTProfileTagAlways, @"native", _cookies[tag], label, @"ABI42_0_0RCTPerformanceLogger");
  }
#endif
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = CACurrentMediaTime() * 1000;
  } else {
    ABI42_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (void)setValue:(int64_t)value forTag:(ABI42_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(ABI42_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(ABI42_0_0RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(ABI42_0_0RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    ABI42_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI42_0_0RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(ABI42_0_0RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(ABI42_0_0RCTPLTag)tag
{
  return _data[tag][1];
}

@end
