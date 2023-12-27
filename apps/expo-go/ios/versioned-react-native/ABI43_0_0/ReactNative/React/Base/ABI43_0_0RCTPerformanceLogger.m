/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI43_0_0RCTLog.h"
#import "ABI43_0_0RCTPerformanceLogger.h"
#import "ABI43_0_0RCTProfile.h"
#import "ABI43_0_0RCTRootView.h"

@interface ABI43_0_0RCTPerformanceLogger () {
  int64_t _data[ABI43_0_0RCTPLSize][2];
  NSUInteger _cookies[ABI43_0_0RCTPLSize];
}

@property (nonatomic, copy) NSArray<NSString *> *labelsForTags;

@end

@implementation ABI43_0_0RCTPerformanceLogger

- (instancetype)init
{
  if (self = [super init]) {
    // Keep this in sync with ABI43_0_0RCTPLTag
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
      @"ABI43_0_0ReactInstanceInit",
    ];
  }
  return self;
}

- (void)markStartForTag:(ABI43_0_0RCTPLTag)tag
{
#if ABI43_0_0RCT_PROFILE
  if (ABI43_0_0RCTProfileIsProfiling()) {
    NSString *label = _labelsForTags[tag];
    _cookies[tag] = ABI43_0_0RCTProfileBeginAsyncEvent(ABI43_0_0RCTProfileTagAlways, label, nil);
  }
#endif
  _data[tag][0] = CACurrentMediaTime() * 1000;
  _data[tag][1] = 0;
}

- (void)markStopForTag:(ABI43_0_0RCTPLTag)tag
{
#if ABI43_0_0RCT_PROFILE
  if (ABI43_0_0RCTProfileIsProfiling()) {
    NSString *label = _labelsForTags[tag];
    ABI43_0_0RCTProfileEndAsyncEvent(ABI43_0_0RCTProfileTagAlways, @"native", _cookies[tag], label, @"ABI43_0_0RCTPerformanceLogger");
  }
#endif
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = CACurrentMediaTime() * 1000;
  } else {
    ABI43_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (void)setValue:(int64_t)value forTag:(ABI43_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(ABI43_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(ABI43_0_0RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(ABI43_0_0RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    ABI43_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI43_0_0RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(ABI43_0_0RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(ABI43_0_0RCTPLTag)tag
{
  return _data[tag][1];
}

@end
