// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXLocalization/ABI43_0_0EXLocalization.h>

@implementation ABI43_0_0EXLocalization

ABI43_0_0EX_EXPORT_MODULE(ExpoLocalization)

/* 
 * Thanks to RNLocalize
 * https://github.com/react-native-community/react-native-localize
 */

ABI43_0_0EX_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  resolve([self constantsToExport]);
}

- (NSDictionary *)constantsToExport
{
  NSLocale *locale = [NSLocale currentLocale];
  NSString *languageCode = locale.languageCode;
  NSArray<NSString *> *languageIds = [NSLocale preferredLanguages];
  if (![languageIds count]) {
    languageIds = @[@"en-US"];
  }
  
  return @{
    @"currency": locale.currencyCode ?: @"USD",
    @"decimalSeparator": locale.decimalSeparator ?: @".",
    @"digitGroupingSeparator": locale.groupingSeparator ?: @",",
    @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
    @"isMetric": @(locale.usesMetricSystem),
    @"isRTL": @((BOOL)([NSLocale characterDirectionForLanguage:languageCode] == NSLocaleLanguageDirectionRightToLeft)),
    @"locale": languageIds[0],
    @"locales": languageIds,
    @"region": locale.countryCode ?: @"US",
    @"timezone": [NSTimeZone localTimeZone].name,
  };
}

@end
