/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTDatePicker.h"

#import "ABI37_0_0RCTUtils.h"
#import "ABI37_0_0UIView+React.h"

@interface ABI37_0_0RCTDatePicker ()

@property (nonatomic, copy) ABI37_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, assign) NSInteger ABI37_0_0ReactMinuteInterval;

@end

@implementation ABI37_0_0RCTDatePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    [self addTarget:self action:@selector(didChange)
               forControlEvents:UIControlEventValueChanged];
    _ABI37_0_0ReactMinuteInterval = 1;
  }
  return self;
}

ABI37_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

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
  self.minuteInterval = _ABI37_0_0ReactMinuteInterval;
}

- (void)setMinuteInterval:(NSInteger)minuteInterval
{
  [super setMinuteInterval:minuteInterval];
  _ABI37_0_0ReactMinuteInterval = minuteInterval;
}

@end
