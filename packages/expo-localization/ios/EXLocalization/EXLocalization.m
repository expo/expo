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
  NSString *languageCode = [locale objectForKey:NSLocaleLanguageCode];
  NSArray<NSString *> *languageIds = [NSLocale preferredLanguages];
  if (![languageIds count]) {
    languageIds = @[@"en-US"];
  }
  
  return @{
    @"currency": [EXLocalization currencyCodeForLocale:locale] ?: @"USD",
    @"decimalSeparator": [locale objectForKey:NSLocaleDecimalSeparator] ?: @".",
    @"groupingSeparator": [locale objectForKey:NSLocaleGroupingSeparator] ?: @",",
    @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
    @"isMetric": @([[locale objectForKey:NSLocaleUsesMetricSystem] boolValue]),
    @"isRTL": @((BOOL)([NSLocale characterDirectionForLanguage:languageCode] == NSLocaleLanguageDirectionRightToLeft)),
    @"locale": [languageIds objectAtIndex:0],
    @"locales": languageIds,
    @"region": [EXLocalization countryCodeForLocale:locale] ?: @"US",
    @"timezone": [NSTimeZone localTimeZone].name,
  };
}

+ (NSString * _Nullable)countryCodeForLocale:(NSLocale * _Nonnull)locale
{
  NSString *countryCode = [locale objectForKey:NSLocaleCountryCode];
  if (countryCode == nil) {
    return nil;
  }
  if ([countryCode isEqualToString:@"419"]) {
    return @"UN";
  }
  return [countryCode uppercaseString];
}

+ (NSString * _Nullable)currencyCodeForLocale:(NSLocale * _Nonnull)locale
{
  NSString *currencyCode = [locale objectForKey:NSLocaleCurrencyCode];
  return currencyCode != nil ? [currencyCode uppercaseString] : nil;
}

@end
