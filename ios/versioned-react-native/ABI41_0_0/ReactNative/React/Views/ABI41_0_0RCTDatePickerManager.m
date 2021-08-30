/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTDatePickerManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import "ABI41_0_0RCTBridge.h"
#import "ABI41_0_0RCTDatePicker.h"
#import "ABI41_0_0RCTEventDispatcher.h"
#import "ABI41_0_0UIView+React.h"

@implementation ABI41_0_0RCTConvert (UIDatePicker)

ABI41_0_0RCT_ENUM_CONVERTER(
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

@implementation ABI41_0_0RCTDatePickerManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI41_0_0RCTDatePicker new];
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI41_0_0RCTBubblingEventBlock)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI41_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI41_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI41_0_0RCTDatePicker class]]) {
      [(ABI41_0_0RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI41_0_0RCTPicker` view is subview of `ABI41_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI41_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI41_0_0RCTDatePicker class]]) {
        [(ABI41_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI41_0_0RCTLogError(@"view type must be ABI41_0_0RCTPicker");
      }
    }
  }];
}

@end
