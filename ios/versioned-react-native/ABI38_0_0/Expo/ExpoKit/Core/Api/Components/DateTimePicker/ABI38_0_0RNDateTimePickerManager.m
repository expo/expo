/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RNDateTimePickerManager.h"

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import "ABI38_0_0RNDateTimePicker.h"
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>

@implementation ABI38_0_0RCTConvert(UIDatePicker)

ABI38_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI38_0_0RNDateTimePickerManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0RNDateTimePicker new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(textColor, UIColor, ABI38_0_0RNDateTimePicker)
{
  if (json) {
    [view setValue:[ABI38_0_0RCTConvert UIColor:json] forKey:@"textColor"];
    [view setValue:@(NO) forKey:@"highlightsToday"];
  } else {
    UIColor* defaultColor;
    if (@available(iOS 13.0, *)) {
        defaultColor = [UIColor labelColor];
    } else {
        defaultColor = [UIColor blackColor];
    }
    [view setValue:defaultColor forKey:@"textColor"];
    [view setValue:@(YES) forKey:@"highlightsToday"];
  }
}

@end
