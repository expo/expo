/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTDatePickerManager.h"

#import "ABI37_0_0RCTBridge.h"
#import "ABI37_0_0RCTDatePicker.h"
#import "ABI37_0_0RCTEventDispatcher.h"
#import "ABI37_0_0UIView+React.h"

@implementation ABI37_0_0RCTConvert(UIDatePicker)

ABI37_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI37_0_0RCTDatePickerManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI37_0_0RCTDatePicker new];
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI37_0_0RCTBubblingEventBlock)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI37_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
