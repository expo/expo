// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXLocalization/ABI37_0_0EXLocalization.h>

@implementation ABI37_0_0EXLocalization

ABI37_0_0UM_EXPORT_MODULE(ExpoLocalization)

/* 
 * Thanks to RNLocalize 
 * https://github.com/ABI37_0_0React-native-community/ABI37_0_0React-native-localize/blame/e9e01ce65e3891241c88adf162679ab8e37759e3/ios/RNLanguages.m#L13
 */
 
ABI37_0_0UM_EXPORT_METHOD_AS(getLocalizationAsync,
                    getLocalizationAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  resolve([self constantsToExport]);
}

- (NSDictionary *)constantsToExport
{
  NSArray<NSString *> *preferredLocales = [NSLocale preferredLanguages];
  if (preferredLocales == nil) {
    NSString *currentLocale = [[NSLocale currentLocale] localeIdentifier];
    if (currentLocale == nil) {
      currentLocale = @"en_US";
    }
    preferredLocales = @[currentLocale];
  }
  
  NSTimeZone *currentTimeZone = [NSTimeZone localTimeZone];
  NSString *region = [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
  
  return @{
           @"isRTL": @([self isRTL]),
           @"locale": [preferredLocales objectAtIndex:0],
           @"locales": preferredLocales,
           @"timezone": [currentTimeZone name],
           @"isoCurrencyCodes": [NSLocale ISOCurrencyCodes],
           @"region": ABI37_0_0UMNullIfNil(region)
           };
}

- (BOOL)isRTL
{
  // https://stackoverflow.com/a/14183124/1123156
  return [NSLocale characterDirectionForLanguage:[NSLocale preferredLanguages][0]] == NSLocaleLanguageDirectionRightToLeft;
}

@end
