/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTDatePickerManager.h"

#import "ABI31_0_0RCTBridge.h"
#import "ABI31_0_0RCTDatePicker.h"
#import "ABI31_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI31_0_0.h"

@implementation ABI31_0_0RCTConvert(UIDatePicker)

ABI31_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI31_0_0RCTDatePickerManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI31_0_0RCTDatePicker new];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI31_0_0RCTBubblingEventBlock)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
