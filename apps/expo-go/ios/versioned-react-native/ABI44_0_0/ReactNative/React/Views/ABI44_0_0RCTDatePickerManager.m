/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTDatePickerManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import "ABI44_0_0RCTBridge.h"
#import "ABI44_0_0RCTDatePicker.h"
#import "ABI44_0_0UIView+React.h"

@implementation ABI44_0_0RCTConvert (UIDatePicker)

ABI44_0_0RCT_ENUM_CONVERTER(
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

@implementation ABI44_0_0RCTDatePickerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RCTDatePicker new];
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI44_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI44_0_0RCTDatePicker class]]) {
      [(ABI44_0_0RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI44_0_0RCTDatePicker` view is subview of `ABI44_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI44_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = [uiManager viewForABI44_0_0ReactTag:viewTag].subviews.firstObject;
      if ([subview isKindOfClass:[ABI44_0_0RCTDatePicker class]]) {
        [(ABI44_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI44_0_0RCTLogError(@"view type must be ABI44_0_0RCTDatePicker");
      }
    }
  }];
}

@end
