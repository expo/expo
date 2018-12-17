/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTDatePickerManager.h"

#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTDatePicker.h"
#import "ABI32_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI32_0_0.h"

@implementation ABI32_0_0RCTConvert(UIDatePicker)

ABI32_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI32_0_0RCTDatePickerManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI32_0_0RCTDatePicker new];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI32_0_0RCTBubblingEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
