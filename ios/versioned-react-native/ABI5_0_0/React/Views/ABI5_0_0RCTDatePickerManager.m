/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTDatePickerManager.h"

#import "ABI5_0_0RCTBridge.h"
#import "ABI5_0_0RCTDatePicker.h"
#import "ABI5_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI5_0_0.h"

@implementation ABI5_0_0RCTConvert(UIDatePicker)

ABI5_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI5_0_0RCTDatePickerManager

ABI5_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI5_0_0RCTDatePicker new];
}

ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI5_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI5_0_0RCTBubblingEventBlock)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI5_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

- (NSDictionary<NSString *, id> *)constantsToExport
{
  UIDatePicker *view = [UIDatePicker new];
  return @{
    @"ComponentHeight": @(view.intrinsicContentSize.height),
    @"ComponentWidth": @(view.intrinsicContentSize.width),
  };
}

@end
