/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI45_0_0RCTDatePickerManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import "ABI45_0_0RCTBridge.h"
#import "ABI45_0_0RCTDatePicker.h"
#import "ABI45_0_0UIView+React.h"

@implementation ABI45_0_0RCTConvert (UIDatePicker)

ABI45_0_0RCT_ENUM_CONVERTER(
    UIDatePickerMode,
    (@{
      @"time" : @(UIDatePickerModeTime),
      @"date" : @(UIDatePickerModeDate),
      @"datetime" : @(UIDatePickerModeDateAndTime),
      @"countdown" : @(UIDatePickerModeCountDownTimer), // not supported yet
    }),
    UIDatePickerModeTime,
    integerValue)

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0

ABI45_0_0RCT_ENUM_CONVERTER(
    UIDatePickerStyle,
    (@{
      @"compact" : @(UIDatePickerStyleCompact),
      @"spinner" : @(UIDatePickerStyleWheels),
      @"inline" : @(UIDatePickerStyleInline),
    }),
    UIDatePickerStyleAutomatic,
    integerValue)
#endif
#pragma clang diagnostic pop
@end

@implementation ABI45_0_0RCTDatePickerManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI45_0_0RCTDatePicker new];
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI45_0_0RCTBubblingEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI45_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [self.bridge.uiManager addUIBlock:^(ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[ABI45_0_0RCTDatePicker class]]) {
      [(ABI45_0_0RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI45_0_0RCTDatePicker` view is subview of `ABI45_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI45_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = [uiManager viewForABI45_0_0ReactTag:viewTag].subviews.firstObject;
      if ([subview isKindOfClass:[ABI45_0_0RCTDatePicker class]]) {
        [(ABI45_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI45_0_0RCTLogError(@"view type must be ABI45_0_0RCTDatePicker");
      }
    }
  }];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
ABI45_0_0RCT_CUSTOM_VIEW_PROPERTY(pickerStyle, UIDatePickerStyle, ABI45_0_0RCTDatePicker)
{
  if (@available(iOS 14, *)) {
    // If the style changed, then the date picker may need to be resized and will generate a layout pass to display
    // correctly. We need to prevent that to get consistent layout. That's why we memorise the old frame and set it
    // after style is changed.
    CGRect oldFrame = view.frame;
    if (json) {
      UIDatePickerStyle style = [ABI45_0_0RCTConvert UIDatePickerStyle:json];
      view.preferredDatePickerStyle = style;
    } else {
      view.preferredDatePickerStyle = UIDatePickerStyleWheels;
    }
    view.frame = oldFrame;
  }
}
#endif
@end
