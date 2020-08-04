/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTDatePickerManager.h"

#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTDatePicker.h"
#import "ABI38_0_0RCTEventDispatcher.h"
#import "ABI38_0_0UIView+React.h"
#import <ABI38_0_0React/ABI38_0_0RCTUIManager.h>

@implementation ABI38_0_0RCTConvert(UIDatePicker)

ABI38_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
  @"countdown": @(UIDatePickerModeCountDownTimer), // not supported yet
}), UIDatePickerModeTime, integerValue)

@end

@implementation ABI38_0_0RCTDatePickerManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI38_0_0RCTDatePicker new];
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI38_0_0RCTBubblingEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI38_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(ABI38_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    
    if ([view isKindOfClass:[ABI38_0_0RCTDatePicker class]]) {
      [(ABI38_0_0RCTDatePicker *)view setDate:date];
    } else {
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI38_0_0RCTDatePicker class]]) {
        [(ABI38_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI38_0_0RCTLogError(@"view type must be ABI38_0_0RCTPicker");
      }
    }
  }];
}

@end
