/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI36_0_0RCTDatePickerManager.h"

#import "ABI36_0_0RCTBridge.h"
#import "ABI36_0_0RCTDatePicker.h"
#import "ABI36_0_0RCTEventDispatcher.h"
#import "ABI36_0_0UIView+React.h"

@implementation ABI36_0_0RCTConvert(UIDatePicker)

ABI36_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI36_0_0RCTDatePickerManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI36_0_0RCTDatePicker new];
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
