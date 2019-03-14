// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAppAuth/EXAppAuth+JSON.h>
#import <UMCore/UMUtilities.h>

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
           @"accessToken": EXnullIfEmpty([input accessToken]),
           @"accessTokenExpirationDate": UMNullIfNil([[self class] dateNativeToJSON:[input accessTokenExpirationDate]]),
           @"additionalParameters": UMNullIfNil([input additionalParameters]),
           @"idToken": EXnullIfEmpty([input idToken]),
           @"tokenType": EXnullIfEmpty([input tokenType]),
           };
}


@end
