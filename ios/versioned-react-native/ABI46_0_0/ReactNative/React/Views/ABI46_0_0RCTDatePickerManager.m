/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI46_0_0RCTDatePickerManager.h"
#import "ABI46_0_0RCTBridge.h"
#import "ABI46_0_0RCTDatePicker.h"
#import "ABI46_0_0UIView+React.h"

@implementation ABI46_0_0RCTConvert (UIDatePicker)

ABI46_0_0RCT_ENUM_CONVERTER(
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

ABI46_0_0RCT_ENUM_CONVERTER(
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

@implementation ABI46_0_0RCTDatePickerManager

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI46_0_0RCTDatePicker new];
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI46_0_0RCT_EXPORT_METHOD(setNativeDate : (nonnull NSNumber *)viewTag toDate : (NSDate *)date)
{
  [_viewRegistry_DEPRECATED addUIBlock:^(ABI46_0_0RCTViewRegistry *viewRegistry) {
    UIView *view = [viewRegistry viewForABI46_0_0ReactTag:viewTag];
    if ([view isKindOfClass:[ABI46_0_0RCTDatePicker class]]) {
      [(ABI46_0_0RCTDatePicker *)view setDate:date];
    } else {
      // This component is used in Fabric through LegacyInteropLayer.
      // `ABI46_0_0RCTDatePicker` view is subview of `ABI46_0_0RCTLegacyViewManagerInteropComponentView`.
      // `viewTag` passed as parameter to this method is tag of the `ABI46_0_0RCTLegacyViewManagerInteropComponentView`.
      UIView *subview = view.subviews.firstObject;
      if ([subview isKindOfClass:[ABI46_0_0RCTDatePicker class]]) {
        [(ABI46_0_0RCTDatePicker *)subview setDate:date];
      } else {
        ABI46_0_0RCTLogError(@"view type must be ABI46_0_0RCTDatePicker");
      }
    }
  }];
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
ABI46_0_0RCT_CUSTOM_VIEW_PROPERTY(pickerStyle, UIDatePickerStyle, ABI46_0_0RCTDatePicker)
{
  if (@available(iOS 14, *)) {
    // If the style changed, then the date picker may need to be resized and will generate a layout pass to display
    // correctly. We need to prevent that to get consistent layout. That's why we memorise the old frame and set it
    // after style is changed.
    CGRect oldFrame = view.frame;
    if (json) {
      UIDatePickerStyle style = [ABI46_0_0RCTConvert UIDatePickerStyle:json];
      view.preferredDatePickerStyle = style;
    } else {
      view.preferredDatePickerStyle = UIDatePickerStyleWheels;
    }
    view.frame = oldFrame;
  }
}
#endif
@end
