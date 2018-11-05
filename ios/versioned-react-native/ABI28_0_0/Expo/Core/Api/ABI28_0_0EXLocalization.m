// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI28_0_0/ABI28_0_0RCTConvert.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUtils.h>

#import "ABI28_0_0EXLocalization.h"

@implementation ABI28_0_0EXLocalization

ABI28_0_0RCT_EXPORT_MODULE(ExponentLocalization);

ABI28_0_0RCT_REMAP_METHOD(getCurrentLocaleAsync,
                 getCurrentLocaleWithResolver:(ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI28_0_0RCTPromiseRejectBlock)reject)
{
  NSArray<NSString *> *preferredLanguages = [NSLocale preferredLanguages];
  if (preferredLanguages.count > 0) {
    resolve(preferredLanguages[0]);
  } else {
    NSString *errMsg = @"This device does not indicate its locale";
    reject(@"E_NO_PREFERRED_LOCALE", errMsg, ABI28_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI28_0_0RCT_REMAP_METHOD(getCurrentDeviceCountryAsync,
                 getCurrentDeviceCountryWithResolver: (ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI28_0_0RCTPromiseRejectBlock)reject)
{
  NSString *countryCode =
      [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  if (countryCode) {
    resolve(countryCode);
  } else {
    NSString *errMsg = @"This device does not indicate its country";
    reject(@"E_NO_DEVICE_COUNTRY", errMsg, ABI28_0_0RCTErrorWithMessage(errMsg));
  }
}

ABI28_0_0RCT_REMAP_METHOD(getPreferredLocalesAsync,
                 getPreferredLocalesWithResolver: (ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI28_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale preferredLanguages]);
}

ABI28_0_0RCT_REMAP_METHOD(getISOCurrencyCodesAsync,
                 getISOCurrencyCodesWithResolver: (ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (__unused ABI28_0_0RCTPromiseRejectBlock)reject)
{
  resolve([NSLocale ISOCurrencyCodes]);
}

ABI28_0_0RCT_REMAP_METHOD(getCurrentTimeZoneAsync,
                 getCurrentTimeZoneWithResolver: (ABI28_0_0RCTPromiseResolveBlock)resolve
                 rejecter: (ABI28_0_0RCTPromiseRejectBlock)reject)
{
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  if (currentTimeZone) {
    resolve(currentTimeZone.name);
  } else {
    NSString *errMsg = @"Unable to determine the device's time zone";
    reject(@"E_NO_DEVICE_TIMEZONE", errMsg, ABI28_0_0RCTErrorWithMessage(errMsg));
  }
}
@end
