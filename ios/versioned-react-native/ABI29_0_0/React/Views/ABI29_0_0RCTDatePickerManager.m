/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTDatePickerManager.h"

#import "ABI29_0_0RCTBridge.h"
#import "ABI29_0_0RCTDatePicker.h"
#import "ABI29_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI29_0_0.h"

@implementation ABI29_0_0RCTConvert(UIDatePicker)

ABI29_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI29_0_0RCTDatePickerManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI29_0_0RCTDatePicker new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
