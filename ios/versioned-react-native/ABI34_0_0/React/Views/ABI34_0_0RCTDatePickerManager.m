/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTDatePickerManager.h"

#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTDatePicker.h"
#import "ABI34_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI34_0_0.h"

@implementation ABI34_0_0RCTConvert(UIDatePicker)

ABI34_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI34_0_0RCTDatePickerManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI34_0_0RCTDatePicker new];
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
