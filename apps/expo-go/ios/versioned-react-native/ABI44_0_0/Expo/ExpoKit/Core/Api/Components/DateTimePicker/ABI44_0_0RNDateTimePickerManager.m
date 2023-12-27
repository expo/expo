/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RNDateTimePickerManager.h"

#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventDispatcher.h>
#import "ABI44_0_0RNDateTimePicker.h"
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

@implementation ABI44_0_0RCTConvert(UIDatePicker)

ABI44_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
}), UIDatePickerModeTime, integerValue)


#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wunguarded-availability-new"
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_14_0

typedef UIDatePickerStyle ABI44_0_0RNCUIDatePickerStyle;

// using UIDatePickerStyle directly conflicts with ABI44_0_0RN implementation
ABI44_0_0RCT_ENUM_CONVERTER(ABI44_0_0RNCUIDatePickerStyle, (@{
    @"default": @(UIDatePickerStyleAutomatic),
    @"compact": @(UIDatePickerStyleCompact),
    @"spinner": @(UIDatePickerStyleWheels),
    @"inline": @(UIDatePickerStyleInline),
}), UIDatePickerStyleAutomatic, integerValue)


ABI44_0_0RCT_ENUM_CONVERTER(UIUserInterfaceStyle, (@{
    @"dark": @(UIUserInterfaceStyleDark),
    @"light": @(UIUserInterfaceStyleLight),
}), UIUserInterfaceStyleUnspecified, integerValue)

#endif
#pragma clang diagnostic pop


@end

@implementation ABI44_0_0RNDateTimePickerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI44_0_0RNDateTimePicker new];
}

+ (NSString*) datepickerStyleToString: (UIDatePickerStyle) style  API_AVAILABLE(ios(13.4)){
    // ABI44_0_0RCTConvert does not handle this.?
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

ABI44_0_0RCT_EXPORT_METHOD(getDefaultDisplayValue:(NSDictionary *)options resolver:(ABI44_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI44_0_0RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
      if (@available(iOS 13.4, *)) {
        UIDatePicker* view = [ABI44_0_0RNDateTimePicker new];
        
        view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        UIDatePickerMode renderedMode = [ABI44_0_0RCTConvert UIDatePickerMode:options[@"mode"]];
        view.datePickerMode = renderedMode;
        // NOTE afaict we do not need to measure the actual dimensions here, but if we do, just look at the original PR
        
        UIDatePickerStyle determinedDisplayValue = view.datePickerStyle;

        resolve(@{
                 @"determinedDisplayValue": [ABI44_0_0RNDateTimePickerManager datepickerStyleToString:determinedDisplayValue],
                });
      } else {
        // never happens; the condition is just to avoid compiler warnings
        reject(@"UNEXPECTED_CALL", @"unexpected getDefaultDisplayValue() call", nil);
      }
    });
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(enabled, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI44_0_0RCTBubblingEventBlock)

ABI44_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(themeVariant, UIUserInterfaceStyle, ABI44_0_0RNDateTimePicker) {
    if (@available(iOS 13.0, *)) {
        if (json) {
            UIUserInterfaceStyle propValue = [ABI44_0_0RCTConvert UIUserInterfaceStyle:json];
            view.overrideUserInterfaceStyle = propValue;
        } else {
            view.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
        }
    }
}

ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(textColor, UIColor, ABI44_0_0RNDateTimePicker)
{
  if (@available(iOS 14.0, *)) {
    if (view.datePickerStyle != UIDatePickerStyleWheels) {
      // prevents #247
      return;
    }
  }
  if (json) {
    [view setValue:[ABI44_0_0RCTConvert UIColor:json] forKey:@"textColor"];
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

// TODO vonovak setting preferredDatePickerStyle invalidates minuteinterval
ABI44_0_0RCT_CUSTOM_VIEW_PROPERTY(displayIOS, ABI44_0_0RNCUIDatePickerStyle, ABI44_0_0RNDateTimePicker)
{
    // officially since 13.4 (https://developer.apple.com/documentation/uikit/uidatepickerstyle?language=objc) but practically since 14
    if (@available(iOS 14.0, *)) {
        if (json) {
            UIDatePickerStyle propValue = [ABI44_0_0RCTConvert ABI44_0_0RNCUIDatePickerStyle:json];
            view.preferredDatePickerStyle = propValue;
        } else {
            view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        }
    }
}

@end
