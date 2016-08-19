/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTDatePickerManager.h"

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTDatePicker.h"
#import "ABI9_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI9_0_0.h"

@implementation ABI9_0_0RCTConvert(UIDatePicker)

ABI9_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI9_0_0RCTDatePickerManager

ABI9_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI9_0_0RCTDatePicker new];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI9_0_0RCTBubblingEventBlock)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
