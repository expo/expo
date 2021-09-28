/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTDatePickerManager.h"

#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import "ABI43_0_0RCTBridge.h"
#import "ABI43_0_0RCTDatePicker.h"
#import "ABI43_0_0UIView+React.h"

@implementation ABI43_0_0RCTConvert (UIDatePicker)

ABI43_0_0RCT_ENUM_CONVERTER(
    UIDatePickerMode,
    (@{
      @"time" : @(UIDatePickerModeTime),
      @"date" : @(UIDatePickerModeDate),
      @"datetime" : @(UIDatePickerModeDateAndTime),
      @"countdown" : @(UIDatePickerModeCountDownTimer), // not supported yet
    }),
    UIDatePickerModeTime,
    integerValue)

@end

@implementation ABI43_0_0RCTDatePickerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI43_0_0RCTDatePicker new];
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI43_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI43_0_0RCTDatePicker class]]) {
      [(ABI43_0_0RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI43_0_0RCTDatePicker` view is subview of `ABI43_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI43_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = [uiManager viewForABI43_0_0ReactTag:viewTag].subviews.firstObject;
      if ([subview isKindOfClass:[ABI43_0_0RCTDatePicker class]]) {
        [(ABI43_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI43_0_0RCTLogError(@"view type must be ABI43_0_0RCTDatePicker");
      }
    }
  }];
}

@end
