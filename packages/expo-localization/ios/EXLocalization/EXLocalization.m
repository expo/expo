// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXLocalization/EXLocalization.h>

@implementation EXLocalization

EX_EXPORT_MODULE(ExpoLocalization)

EX_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
  // https://stackoverflow.com/a/11352545/4047926
  return [NSLocale characterDirectionForLanguage:[NSLocale preferredLanguages][0]];
}

@end
