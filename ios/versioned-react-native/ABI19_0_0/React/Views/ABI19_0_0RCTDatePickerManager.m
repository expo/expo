/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI19_0_0RCTDatePickerManager.h"

#import "ABI19_0_0RCTBridge.h"
#import "ABI19_0_0RCTDatePicker.h"
#import "ABI19_0_0RCTEventDispatcher.h"
#import "UIView+ReactABI19_0_0.h"

@implementation ABI19_0_0RCTConvert(UIDatePicker)

ABI19_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI19_0_0RCTDatePickerManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI19_0_0RCTDatePicker new];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

@end
