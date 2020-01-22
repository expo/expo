/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTDatePickerManager.h"

#import "ABI35_0_0RCTBridge.h"
#import "ABI35_0_0RCTDatePicker.h"
#import "ABI35_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI35_0_0.h"

@implementation ABI35_0_0RCTConvert(UIDatePicker)

ABI35_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI35_0_0RCTDatePickerManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI35_0_0RCTDatePicker new];
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI35_0_0RCTBubblingEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
