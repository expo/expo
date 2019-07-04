// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXLocalization/ABI31_0_0EXLocalization.h>

@implementation ABI31_0_0EXLocalization

ABI31_0_0EX_EXPORT_MODULE(ExpoLocalization)

- (NSMutableArray *)ensureLocaleTags:(NSArray *)locales
{
    NSMutableArray *sanitizedLocales = [NSMutableArray array];
    for (id locale in locales)
        [sanitizedLocales addObject:[locale stringByReplacingOccurrencesOfString:@"_" withString:@"-"]];

    return sanitizedLocales;
}

ABI31_0_0EX_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(ABI31_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI31_0_0EXPromiseRejectBlock)reject)
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
