/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNDateTimePickerManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import "ABI42_0_0RNDateTimePicker.h"
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>

@implementation ABI42_0_0RCTConvert(UIDatePicker)

ABI42_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
}), UIDatePickerModeTime, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(UIDatePickerStyle, (@{
    @"default": @(UIDatePickerStyleAutomatic),
    @"compact": @(UIDatePickerStyleCompact),
    @"spinner": @(UIDatePickerStyleWheels),
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
    @"inline": @(UIDatePickerStyleInline),
#endif
}), UIDatePickerStyleAutomatic, integerValue)

ABI42_0_0RCT_ENUM_CONVERTER(UIUserInterfaceStyle, (@{
    @"dark": @(UIUserInterfaceStyleDark),
    @"light": @(UIUserInterfaceStyleLight),
}), UIUserInterfaceStyleUnspecified, integerValue)

@end

@implementation ABI42_0_0RNDateTimePickerManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI42_0_0RNDateTimePicker new];
}

+ (NSString*) datepickerStyleToString: (UIDatePickerStyle) style {
    // ABI42_0_0RCTConvert does not handle this.?
    switch (style) {
        case UIDatePickerStyleCompact:
            return @"compact";
        case UIDatePickerStyleWheels:
            return @"spinner";
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
        case UIDatePickerStyleInline:
            return @"inline";
#endif
        default:
            [NSException raise:@"Unsupported style value" format:@"UIDatePickerStyle of %ld is unsupported", (long)style];
            return @"";
    }
}

ABI42_0_0RCT_EXPORT_METHOD(getDefaultDisplayValue:(NSDictionary *)options resolver:(ABI42_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI42_0_0RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIDatePicker* view = [ABI42_0_0RNDateTimePicker new];
        
        view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        UIDatePickerMode renderedMode = [ABI42_0_0RCTConvert UIDatePickerMode:options[@"mode"]];
        view.datePickerMode = renderedMode;
        // NOTE afaict we do not need to measure the actual dimensions here, but if we do, just look at the original PR
        
        UIDatePickerStyle determinedDisplayValue = view.datePickerStyle;

        resolve(@{
                 @"determinedDisplayValue": [ABI42_0_0RNDateTimePickerManager datepickerStyleToString:determinedDisplayValue],
                });
    });
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI42_0_0RCTBubblingEventBlock)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(themeVariant, UIUserInterfaceStyle, ABI42_0_0RNDateTimePicker) {
    if (@available(iOS 13.0, *)) {
        if (json) {
            UIUserInterfaceStyle propValue = [ABI42_0_0RCTConvert UIUserInterfaceStyle:json];
            view.overrideUserInterfaceStyle = propValue;
        } else {
            view.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
        }
    }
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(textColor, UIColor, ABI42_0_0RNDateTimePicker)
{
  if (@available(iOS 14.0, *) && view.datePickerStyle != UIDatePickerStyleWheels) {
    // prevents #247
    return;
  }
  if (json) {
    [view setValue:[ABI42_0_0RCTConvert UIColor:json] forKey:@"textColor"];
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
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(displayIOS, UIDatePickerStyle, ABI42_0_0RNDateTimePicker)
{
    if (@available(iOS 13.4, *)) {
        if (json) {
            UIDatePickerStyle propValue = [ABI42_0_0RCTConvert UIDatePickerStyle:json];
            view.preferredDatePickerStyle = propValue;
        } else {
            view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        }
    }
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(disabled, BOOL, ABI42_0_0RNDateTimePicker)
{
  if (json) {
    view.enabled = !([ABI42_0_0RCTConvert BOOL:json]);
  } else {
    view.enabled = defaultView.enabled;
  }
}

@end
