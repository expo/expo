/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTDatePickerManager.h"

#import "ABI33_0_0RCTBridge.h"
#import "ABI33_0_0RCTDatePicker.h"
#import "ABI33_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI33_0_0.h"

@implementation ABI33_0_0RCTConvert(UIDatePicker)

ABI33_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI33_0_0RCTDatePickerManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI33_0_0RCTDatePicker new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
