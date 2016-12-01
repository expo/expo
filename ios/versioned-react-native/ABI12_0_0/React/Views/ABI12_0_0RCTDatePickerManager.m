/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTDatePickerManager.h"

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTDatePicker.h"
#import "ABI12_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI12_0_0.h"

@implementation ABI12_0_0RCTConvert(UIDatePicker)

ABI12_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI12_0_0RCTDatePickerManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI12_0_0RCTDatePicker new];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI12_0_0RCTBubblingEventBlock)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
