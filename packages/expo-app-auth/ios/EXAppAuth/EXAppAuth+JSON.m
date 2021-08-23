// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuth+JSON.h>
#import <ExpoModulesCore/EXUtilities.h>

@implementation EXAppAuth (JSON)

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
           @"accessToken": EXNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": EXNullIfNil([[self class] dateNativeToJSON:[input accessTokenExpirationDate]]),
           @"additionalParameters": EXNullIfNil([input additionalParameters]),
           @"idToken": EXNullIfNil([input idToken]),
           @"tokenType": EXNullIfNil([input tokenType]),
           };
}


@end
