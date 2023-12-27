// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAppAuth/ABI43_0_0EXAppAuth+JSON.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilities.h>

@implementation ABI43_0_0EXAppAuth (JSON)

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
           @"accessToken": ABI43_0_0EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI43_0_0EXNullIfNil([[self class] dateNativeToJSON:[input accessTokenExpirationDate]]),
           @"additionalParameters": ABI43_0_0EXNullIfNil([input additionalParameters]),
           @"idToken": ABI43_0_0EXNullIfNil([input idToken]),
           @"tokenType": ABI43_0_0EXNullIfNil([input tokenType]),
           };
}


@end
