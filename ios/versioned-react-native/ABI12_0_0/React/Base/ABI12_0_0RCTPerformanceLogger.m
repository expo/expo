/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI12_0_0RCTPerformanceLogger.h"
#import "ABI12_0_0RCTRootView.h"
#import "ABI12_0_0RCTLog.h"
#import "ABI12_0_0RCTProfile.h"

@interface ABI12_0_0RCTPerformanceLogger ()
{
  int64_t _data[ABI12_0_0RCTPLSize][2];
  NSUInteger _cookies[ABI12_0_0RCTPLSize];
}

@property (nonatomic, copy) NSArray<NSString *> *labelsForTags;

@end

@implementation ABI12_0_0RCTPerformanceLogger

- (instancetype)init
{
  if (self = [super init]) {
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
      @"NativeModuleInjectConfig",
      @"NativeModuleMainThreadUsesCount",
      @"JSCWrapperOpenLibrary",
      @"JSCExecutorSetup",
      @"BridgeStartup",
      @"RootViewTTI",
      @"BundleSize",
    ];
  }
  return self;
}

- (void)markStartForTag:(ABI12_0_0RCTPLTag)tag
{
#if ABI12_0_0RCT_PROFILE
  if (ABI12_0_0RCTProfileIsProfiling()) {
    NSString *label = _labelsForTags[tag];
    _cookies[tag] = ABI12_0_0RCTProfileBeginAsyncEvent(ABI12_0_0RCTProfileTagAlways, label, nil);
  }
#endif
  _data[tag][0] = CACurrentMediaTime() * 1000;
  _data[tag][1] = 0;
}


- (void)markStopForTag:(ABI12_0_0RCTPLTag)tag
{
#if ABI12_0_0RCT_PROFILE
  if (ABI12_0_0RCTProfileIsProfiling()) {
    NSString *label =_labelsForTags[tag];
    ABI12_0_0RCTProfileEndAsyncEvent(ABI12_0_0RCTProfileTagAlways, @"native", _cookies[tag], label, @"ABI12_0_0RCTPerformanceLogger");
  }
#endif
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = CACurrentMediaTime() * 1000;
  } else {
    ABI12_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (void)setValue:(int64_t)value forTag:(ABI12_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(ABI12_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(ABI12_0_0RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(ABI12_0_0RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    ABI12_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI12_0_0RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(ABI12_0_0RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(ABI12_0_0RCTPLTag)tag
{
  return _data[tag][1];
}

@end
