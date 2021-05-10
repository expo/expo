// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXLocalization/ABI41_0_0EXLocalization.h>

@implementation ABI41_0_0EXLocalization

ABI41_0_0UM_EXPORT_MODULE(ExpoLocalization)

/* 
 * Thanks to RNLocalize
 * https://github.com/ABI41_0_0React-native-community/ABI41_0_0React-native-localize
 */

ABI41_0_0UM_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
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
