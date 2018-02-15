// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

#import "EXLocalization.h"

@implementation EXLocalization

RCT_EXPORT_MODULE(ExponentLocalization);

RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, RCTErrorWithMessage(errMsg));
  }
}

RCT_REMAP_METHOD(getCurrentDeviceCountryAsync,
                 getCurrentDeviceCountryWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter: (RCTPromiseRejectBlock)reject)
{
  NSString *countryCode =
      [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  if (countryCode) {
    resolve(countryCode);
  } else {
    NSString *errMsg = @"This device does not indicate its country";
    reject(@"E_NO_DEVICE_COUNTRY", errMsg, RCTErrorWithMessage(errMsg));
  }
}

RCT_REMAP_METHOD(getPreferredLocalesAsync,
                 getPreferredLocalesWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter: (RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale preferredLanguages]);
}

RCT_REMAP_METHOD(getISOCurrencyCodesAsync,
                 getISOCurrencyCodesWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter: (__unused RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale ISOCurrencyCodes]);
}

RCT_REMAP_METHOD(getCurrentTimeZoneAsync,
                 getCurrentTimeZoneWithResolver: (RCTPromiseResolveBlock)resolve
                 rejecter: (RCTPromiseRejectBlock)reject)
{
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  if (currentTimeZone) {
    resolve(currentTimeZone.name);
  } else {
    NSString *errMsg = @"Unable to determine the device's time zone";
    reject(@"E_NO_DEVICE_TIMEZONE", errMsg, RCTErrorWithMessage(errMsg));
  }
}
@end
