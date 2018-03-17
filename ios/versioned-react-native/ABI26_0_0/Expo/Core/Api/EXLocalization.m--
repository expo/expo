// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUtils.h>

#import "ABI26_0_0EXLocalization.h"

@implementation ABI26_0_0EXLocalization

ABI26_0_0RCT_EXPORT_MODULE(ExponentLocalization);

ABI26_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI26_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI26_0_0RCT_REMAP_METHOD(getCurrentDeviceCountryAsync,
                 getCurrentDeviceCountryWithResolver: (ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI26_0_0RCTPromiseRejectBlock)reject)
{
  NSString *countryCode =
      [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  if (countryCode) {
    resolve(countryCode);
  } else {
    NSString *errMsg = @"This device does not indicate its country";
    reject(@"E_NO_DEVICE_COUNTRY", errMsg, ABI26_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI26_0_0RCT_REMAP_METHOD(getPreferredLocalesAsync,
                 getPreferredLocalesWithResolver: (ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI26_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale preferredLanguages]);
}

ABI26_0_0RCT_REMAP_METHOD(getISOCurrencyCodesAsync,
                 getISOCurrencyCodesWithResolver: (ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale ISOCurrencyCodes]);
}

ABI26_0_0RCT_REMAP_METHOD(getCurrentTimeZoneAsync,
                 getCurrentTimeZoneWithResolver: (ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI26_0_0RCTPromiseRejectBlock)reject)
{
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  if (currentTimeZone) {
    resolve(currentTimeZone.name);
  } else {
    NSString *errMsg = @"Unable to determine the device's time zone";
    reject(@"E_NO_DEVICE_TIMEZONE", errMsg, ABI26_0_0RCTErrorWithMessage(errMsg));
  }
}
@end
