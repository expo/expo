/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNDateTimePicker.h"

#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>

@interface ABI41_0_0RNDateTimePicker ()

@property (nonatomic, copy) ABI41_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, assign) NSInteger ABI41_0_0ReactMinuteInterval;

@end

@implementation ABI41_0_0RNDateTimePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self addTarget:self action:@selector(didChange)
               forControlEvents:UIControlEventValueChanged];
    _ABI41_0_0ReactMinuteInterval = 1;
  }
  return self;
}

ABI41_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{ @"timestamp": @(self.date.timeIntervalSince1970 * 1000.0) });
  }
}

- (void)setDatePickerMode:(UIDatePickerMode)datePickerMode
{
  [super setDatePickerMode:datePickerMode];
  // We need to set minuteInterval after setting datePickerMode, otherwise minuteInterval is invalid in time mode.
  self.minuteInterval = _ABI41_0_0ReactMinuteInterval;
}

- (void)setMinuteInterval:(NSInteger)minuteInterval
{
  [super setMinuteInterval:minuteInterval];
  _ABI41_0_0ReactMinuteInterval = minuteInterval;
}

- (void)setDate:(NSDate *)date {
    // Need to avoid the case where values coming back through the bridge trigger a new valueChanged event
    if (![self.date isEqualToDate:date]) {
        [super setDate:date];
    }
}

@end
