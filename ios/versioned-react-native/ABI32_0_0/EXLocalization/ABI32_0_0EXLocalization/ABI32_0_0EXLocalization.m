// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXLocalization/ABI32_0_0EXLocalization.h>

@implementation ABI32_0_0EXLocalization

ABI32_0_0EX_EXPORT_MODULE(ExpoLocalization)

- (NSMutableArray *)ensureLocaleTags:(NSArray *)locales
{
    NSMutableArray *sanitizedLocales = [NSMutableArray array];
    for (id locale in locales)
        [sanitizedLocales addObject:[locale stringByReplacingOccurrencesOfString:@"_" withString:@"-"]];

    return sanitizedLocales;
}

ABI32_0_0EX_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(ABI32_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI32_0_0EXPromiseRejectBlock)reject)
{
  resolve([self constantsToExport]);
}

- (NSDictionary *)constantsToExport
{
  NSArray *preferredLocales = [self ensureLocaleTags:[NSLocale preferredLanguages]];
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  NSString *countryCode = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  
  NSLocaleLanguageDirection localeLanguageDirection = [NSLocale characterDirectionForLanguage:[NSLocale preferredLanguages][0]];
  BOOL isRTL = localeLanguageDirection == NSLocaleLanguageDirectionRightToLeft;
  
  return @{
           @"isRTL": @(isRTL),
           @"locale": [preferredLocales objectAtIndex:0],
           @"locales": preferredLocales,
           @"timezone": [currentTimeZone name],
           @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
           @"country": countryCode
           };
}

@end
