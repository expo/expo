/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNDateTimePickerManager.h"
#import "ABI49_0_0RNDateTimePickerShadowView.h"

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventDispatcher.h>
#import "ABI49_0_0RNDateTimePicker.h"
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

#ifndef __IPHONE_15_0
@interface UIColor (Xcode12)
+ (instancetype) tintColor;
@end
#endif

@implementation ABI49_0_0RCTConvert(UIDatePicker)

ABI49_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
}), UIDatePickerModeTime, integerValue)


#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0

typedef UIDatePickerStyle ABI49_0_0RNCUIDatePickerStyle;

// using UIDatePickerStyle directly conflicts with ABI49_0_0RN implementation
ABI49_0_0RCT_ENUM_CONVERTER(ABI49_0_0RNCUIDatePickerStyle, (@{
    @"default": @(UIDatePickerStyleAutomatic),
    @"compact": @(UIDatePickerStyleCompact),
    @"spinner": @(UIDatePickerStyleWheels),
    @"inline": @(UIDatePickerStyleInline),
}), UIDatePickerStyleAutomatic, integerValue)


ABI49_0_0RCT_ENUM_CONVERTER(UIUserInterfaceStyle, (@{
    @"dark": @(UIUserInterfaceStyleDark),
    @"light": @(UIUserInterfaceStyleLight),
}), UIUserInterfaceStyleUnspecified, integerValue)

#endif
#pragma clang diagnostic pop


@end

@implementation ABI49_0_0RNDateTimePickerManager {
  ABI49_0_0RNDateTimePicker* _picker;
}

ABI49_0_0RCT_EXPORT_MODULE()

- (instancetype)init {
  if (self = [super init]) {
    _picker = [ABI49_0_0RNDateTimePicker new];
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup {
  return true;
}

- (UIView *)view
{
  return [ABI49_0_0RNDateTimePicker new];
}

- (ABI49_0_0RCTShadowView *)shadowView
{
  ABI49_0_0RNDateTimePickerShadowView* shadowView =  [ABI49_0_0RNDateTimePickerShadowView new];
  shadowView.picker = _picker;
  return shadowView;
}

+ (NSString*) datepickerStyleToString: (UIDatePickerStyle) style  API_AVAILABLE(ios(13.4)){
    // ABI49_0_0RCTConvert does not handle this.?
    switch (style) {
        case UIDatePickerStyleCompact:
            return @"compact";
        case UIDatePickerStyleWheels:
            return @"spinner";
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0
        case UIDatePickerStyleInline:
            return @"inline";
#endif
        default:
            [NSException raise:@"Unsupported style value" format:@"UIDatePickerStyle of %ld is unsupported", (long)style];
            return @"";
    }
}

ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(date, NSDate)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(mode, UIDatePickerMode)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(locale, NSLocale)
ABI49_0_0RCT_EXPORT_SHADOW_PROPERTY(displayIOS, ABI49_0_0RNCUIDatePickerStyle)

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI49_0_0RCTBubblingEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onPickerDismiss, ABI49_0_0RCTBubblingEventBlock)

ABI49_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI49_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(themeVariant, UIUserInterfaceStyle, ABI49_0_0RNDateTimePicker) {
    if (@available(iOS 13.0, *)) {
        if (json) {
            UIUserInterfaceStyle propValue = [ABI49_0_0RCTConvert UIUserInterfaceStyle:json];
            view.overrideUserInterfaceStyle = propValue;
        } else {
            view.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
        }
    }
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(textColor, UIColor, ABI49_0_0RNDateTimePicker)
{
  if (@available(iOS 14.0, *)) {
    if (view.datePickerStyle != UIDatePickerStyleWheels) {
      // prevents #247
      return;
    }
  }
  if (json) {
    [view setValue:[ABI49_0_0RCTConvert UIColor:json] forKey:@"textColor"];
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

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(accentColor, UIColor, ABI49_0_0RNDateTimePicker)
{
    if (json) {
        [view setTintColor:[ABI49_0_0RCTConvert UIColor:json]];
    } else {
        if (@available(iOS 15.0, *)) {
            [view setTintColor:[UIColor tintColor]];
        } else {
            [view setTintColor:[UIColor systemBlueColor]];
        }
    }
}

// TODO vonovak setting preferredDatePickerStyle invalidates minuteinterval
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(displayIOS, ABI49_0_0RNCUIDatePickerStyle, ABI49_0_0RNDateTimePicker)
{
    // officially since 13.4 (https://developer.apple.com/documentation/uikit/uidatepickerstyle?language=objc) but practically since 14
    if (@available(iOS 14.0, *)) {
        if (json) {
            UIDatePickerStyle propValue = [ABI49_0_0RCTConvert ABI49_0_0RNCUIDatePickerStyle:json];
            view.preferredDatePickerStyle = propValue;
        } else {
            view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        }
    }
}

@end
