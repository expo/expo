/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI15_0_0RCTDatePickerManager.h"

#import "ABI15_0_0RCTBridge.h"
#import "ABI15_0_0RCTDatePicker.h"
#import "ABI15_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI15_0_0.h"

@implementation ABI15_0_0RCTConvert(UIDatePicker)

ABI15_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI15_0_0RCTDatePickerManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI15_0_0RCTDatePicker new];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
