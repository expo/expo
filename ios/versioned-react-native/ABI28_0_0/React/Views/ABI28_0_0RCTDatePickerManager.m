/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTDatePickerManager.h"

#import "ABI28_0_0RCTBridge.h"
#import "ABI28_0_0RCTDatePicker.h"
#import "ABI28_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI28_0_0.h"

@implementation ABI28_0_0RCTConvert(UIDatePicker)

ABI28_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI28_0_0RCTDatePickerManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI28_0_0RCTDatePicker new];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
