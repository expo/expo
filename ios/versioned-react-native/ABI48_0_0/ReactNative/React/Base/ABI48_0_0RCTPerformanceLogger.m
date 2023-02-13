/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import "ABI48_0_0RCTLog.h"
#import "ABI48_0_0RCTPerformanceLogger.h"
#import "ABI48_0_0RCTPerformanceLoggerLabels.h"
#import "ABI48_0_0RCTProfile.h"
#import "ABI48_0_0RCTRootView.h"

@interface ABI48_0_0RCTPerformanceLogger () {
  int64_t _data[ABI48_0_0RCTPLSize][2];
  NSInteger _cookies[ABI48_0_0RCTPLSize];
}

@end

@implementation ABI48_0_0RCTPerformanceLogger

- (void)markStartForTag:(ABI48_0_0RCTPLTag)tag
{
#if ABI48_0_0RCT_PROFILE
  if (ABI48_0_0RCTProfileIsProfiling()) {
    NSString *label = ABI48_0_0RCTPLLabelForTag(tag);
    _cookies[tag] = ABI48_0_0RCTProfileBeginAsyncEvent(ABI48_0_0RCTProfileTagAlways, label, nil);
  }
#endif
  _data[tag][0] = CACurrentMediaTime() * 1000;
  _data[tag][1] = 0;
}

- (void)markStopForTag:(ABI48_0_0RCTPLTag)tag
{
#if ABI48_0_0RCT_PROFILE
  if (ABI48_0_0RCTProfileIsProfiling()) {
    NSString *label = ABI48_0_0RCTPLLabelForTag(tag);
    ABI48_0_0RCTProfileEndAsyncEvent(ABI48_0_0RCTProfileTagAlways, @"native", _cookies[tag], label, @"ABI48_0_0RCTPerformanceLogger");
  }
#endif
  if (_data[tag][0] != 0 && _data[tag][1] == 0) {
    _data[tag][1] = CACurrentMediaTime() * 1000;
  } else {
    ABI48_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (void)setValue:(int64_t)value forTag:(ABI48_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] = value;
}

- (void)addValue:(int64_t)value forTag:(ABI48_0_0RCTPLTag)tag
{
  _data[tag][0] = 0;
  _data[tag][1] += value;
}

- (void)appendStartForTag:(ABI48_0_0RCTPLTag)tag
{
  _data[tag][0] = CACurrentMediaTime() * 1000;
}

- (void)appendStopForTag:(ABI48_0_0RCTPLTag)tag
{
  if (_data[tag][0] != 0) {
    _data[tag][1] += CACurrentMediaTime() * 1000 - _data[tag][0];
    _data[tag][0] = 0;
  } else {
    ABI48_0_0RCTLogInfo(@"Unbalanced calls start/end for tag %li", (unsigned long)tag);
  }
}

- (NSArray<NSNumber *> *)valuesForTags
{
  NSMutableArray *result = [NSMutableArray array];
  for (NSUInteger index = 0; index < ABI48_0_0RCTPLSize; index++) {
    [result addObject:@(_data[index][0])];
    [result addObject:@(_data[index][1])];
  }
  return result;
}

- (int64_t)durationForTag:(ABI48_0_0RCTPLTag)tag
{
  return _data[tag][1] - _data[tag][0];
}

- (int64_t)valueForTag:(ABI48_0_0RCTPLTag)tag
{
  return _data[tag][1];
}

@end
