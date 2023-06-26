/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNDateTimePicker.h"

#import <ABI49_0_0React/ABI49_0_0RCTUtils.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@interface ABI49_0_0RNDateTimePicker ()

@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onChange;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onPickerDismiss;
@property (nonatomic, assign) NSInteger ABI49_0_0ReactMinuteInterval;

@end

@implementation ABI49_0_0RNDateTimePicker

- (instancetype)initWithFrame:(CGRect)frame
{
  if ((self = [super initWithFrame:frame])) {
    #ifndef ABI49_0_0RCT_NEW_ARCH_ENABLED
      // somehow, with Fabric, the callbacks are executed here as well as in ABI49_0_0RNDateTimePickerComponentView
      // so do not register it with Fabric, to avoid potential problems
      [self addTarget:self action:@selector(didChange)
               forControlEvents:UIControlEventValueChanged];
      [self addTarget:self action:@selector(onDismiss:) forControlEvents:UIControlEventEditingDidEnd];
    #endif

    _ABI49_0_0ReactMinuteInterval = 1;
  }
  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithCoder:(NSCoder *)aDecoder)

- (void)didChange
{
  if (_onChange) {
    _onChange(@{ @"timestamp": @(self.date.timeIntervalSince1970 * 1000.0) });
  }
}

- (void)onDismiss:(ABI49_0_0RNDateTimePicker *)sender
{
  if (_onPickerDismiss) {
    _onPickerDismiss(@{});
  }
}

- (void)setDatePickerMode:(UIDatePickerMode)datePickerMode
{
  [super setDatePickerMode:datePickerMode];
  // We need to set minuteInterval after setting datePickerMode, otherwise minuteInterval is invalid in time mode.
  self.minuteInterval = _ABI49_0_0ReactMinuteInterval;
}

- (void)setMinuteInterval:(NSInteger)minuteInterval
{
  [super setMinuteInterval:minuteInterval];
  _ABI49_0_0ReactMinuteInterval = minuteInterval;
}

- (void)setDate:(NSDate *)date {
    // Need to avoid the case where values coming back through the bridge trigger a new valueChanged event
    if (![self.date isEqualToDate:date]) {
        [super setDate:date animated:NO];
    }
}

@end
