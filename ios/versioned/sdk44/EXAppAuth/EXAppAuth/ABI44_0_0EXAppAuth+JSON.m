// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXAppAuth/ABI44_0_0EXAppAuth+JSON.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUtilities.h>

@implementation ABI44_0_0EXAppAuth (JSON)

+ (NSString *)dateNativeToJSON:(NSDate *)input
{
  if (!input) return nil;
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  NSTimeZone *timeZone = [NSTimeZone timeZoneWithName:@"UTC"];
  [dateFormatter setTimeZone:timeZone];
  [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
  [dateFormatter setDateFormat: @"yyyy-MM-dd'T'HH:mm:ss.SSS'Z"];
  return [dateFormatter stringFromDate:input];
}

+ (NSDictionary *)tokenResponseNativeToJSON:(OIDTokenResponse *)input
{
  if (!input) return nil;

  return @{
           @"accessToken": ABI44_0_0EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI44_0_0EXNullIfNil([[self class] dateNativeToJSON:[input accessTokenExpirationDate]]),
           @"additionalParameters": ABI44_0_0EXNullIfNil([input additionalParameters]),
           @"idToken": ABI44_0_0EXNullIfNil([input idToken]),
           @"tokenType": ABI44_0_0EXNullIfNil([input tokenType]),
           };
}


@end
