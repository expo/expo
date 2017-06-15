/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTDatePickerManager.h"

#import "ABI18_0_0RCTBridge.h"
#import "ABI18_0_0RCTDatePicker.h"
#import "ABI18_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI18_0_0.h"

@implementation ABI18_0_0RCTConvert(UIDatePicker)

ABI18_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI18_0_0RCTDatePickerManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI18_0_0RCTDatePicker new];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
