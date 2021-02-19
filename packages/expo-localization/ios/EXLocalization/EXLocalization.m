// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXLocalization/EXLocalization.h>

@implementation EXLocalization

UM_EXPORT_MODULE(ExpoLocalization)

/* 
 * Thanks to RNLocalize
 * https://github.com/react-native-community/react-native-localize
 */

UM_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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
    @"groupingSeparator": locale.groupingSeparator ?: @",",
    @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
    @"isMetric": @(locale.usesMetricSystem),
    @"isRTL": @((BOOL)([NSLocale characterDirectionForLanguage:languageCode] == NSLocaleLanguageDirectionRightToLeft)),
    @"locale": [languageIds objectAtIndex:0],
    @"locales": languageIds,
    @"region": [EXLocalization countryCodeForLocale:locale] ?: @"US",
    @"timezone": [NSTimeZone localTimeZone].name,
  };
}

+ (NSString * _Nullable)countryCodeForLocale:(NSLocale * _Nonnull)locale
{
  NSString *countryCode = locale.countryCode;
  if (countryCode == nil) {
    return nil;
  }
  // overwrite Latin America and Caribbean region
  if ([countryCode isEqualToString:@"419"]) {
    return @"UN";
  }
  return countryCode;
}

@end
