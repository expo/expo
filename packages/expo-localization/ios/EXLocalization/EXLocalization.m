// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXLocalization/EXLocalization.h>

@implementation EXLocalization

UM_EXPORT_MODULE(ExpoLocalization)

/* 
 * Thanks to RNLocalize 
 * https://github.com/react-native-community/react-native-localize/blame/e9e01ce65e3891241c88adf162679ab8e37759e3/ios/RNLanguages.m#L13
 */
 
UM_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self constantsToExport]);
}

- (NSDictionary *)constantsToExport
{
  NSArray<NSString *> *preferredLocales = [NSLocale preferredLanguages];
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  NSString *countryCode = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  
  return @{
           @"isRTL": @([self isRTL]),
           @"locale": [preferredLocales objectAtIndex:0],
           @"locales": preferredLocales,
           @"timezone": [currentTimeZone name],
           @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
           @"country": countryCode
           };
}

- (BOOL)isRTL
{
  // https://stackoverflow.com/a/14183124/1123156
  return [NSLocale characterDirectionForLanguage:[NSLocale preferredLanguages][0]] == NSLocaleLanguageDirectionRightToLeft;
}

@end
