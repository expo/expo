/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTDatePickerManager.h"

#import "ABI14_0_0RCTBridge.h"
#import "ABI14_0_0RCTDatePicker.h"
#import "ABI14_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI14_0_0.h"

@implementation ABI14_0_0RCTConvert(UIDatePicker)

ABI14_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI14_0_0RCTDatePickerManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI14_0_0RCTDatePicker new];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
