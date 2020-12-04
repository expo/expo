/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNDateTimePickerManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventDispatcher.h>
#import "ABI40_0_0RNDateTimePicker.h"
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>

@implementation ABI40_0_0RCTConvert(UIDatePicker)

ABI40_0_0RCT_ENUM_CONVERTER(UIDatePickerMode, (@{
  @"time": @(UIDatePickerModeTime),
  @"date": @(UIDatePickerModeDate),
  @"datetime": @(UIDatePickerModeDateAndTime),
}), UIDatePickerModeTime, integerValue)

ABI40_0_0RCT_ENUM_CONVERTER(UIDatePickerStyle, (@{
    @"default": @(UIDatePickerStyleAutomatic),
    @"compact": @(UIDatePickerStyleCompact),
    @"spinner": @(UIDatePickerStyleWheels),
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000
    @"inline": @(UIDatePickerStyleInline),
#endif
}), UIDatePickerStyleAutomatic, integerValue)

@end

@implementation ABI40_0_0RNDateTimePickerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [ABI40_0_0RNDateTimePicker new];
}

+ (NSString*) datepickerStyleToString: (UIDatePickerStyle) style {
    // ABI40_0_0RCTConvert does not handle this.?
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

ABI40_0_0RCT_EXPORT_METHOD(getDefaultDisplayValue:(NSDictionary *)options resolver:(ABI40_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI40_0_0RCTPromiseRejectBlock)reject)
{
    dispatch_async(dispatch_get_main_queue(), ^{
        UIDatePicker* view = [ABI40_0_0RNDateTimePicker new];
        
        view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        UIDatePickerMode renderedMode = [ABI40_0_0RCTConvert UIDatePickerMode:options[@"mode"]];
        view.datePickerMode = renderedMode;
        // NOTE afaict we do not need to measure the actual dimensions here, but if we do, just look at the original PR
        
        UIDatePickerStyle determinedDisplayValue = view.datePickerStyle;

        resolve(@{
                 @"determinedDisplayValue": [ABI40_0_0RNDateTimePickerManager datepickerStyleToString:determinedDisplayValue],
                });
    });
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(date, NSDate)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(locale, NSLocale)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minimumDate, NSDate)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maximumDate, NSDate)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minuteInterval, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onChange, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(mode, datePickerMode, UIDatePickerMode)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(timeZoneOffsetInMinutes, timeZone, NSTimeZone)

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(textColor, UIColor, ABI40_0_0RNDateTimePicker)
{
  if (@available(iOS 14.0, *) && view.datePickerStyle != UIDatePickerStyleWheels) {
    // prevents #247
    return;
  }
  if (json) {
    [view setValue:[ABI40_0_0RCTConvert UIColor:json] forKey:@"textColor"];
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
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(displayIOS, UIDatePickerStyle, ABI40_0_0RNDateTimePicker)
{
    if (@available(iOS 13.4, *)) {
        if (json) {
            UIDatePickerStyle propValue = [ABI40_0_0RCTConvert UIDatePickerStyle:json];
            view.preferredDatePickerStyle = propValue;
        } else {
            view.preferredDatePickerStyle = UIDatePickerStyleAutomatic;
        }
    }
}

@end
