// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXAppAuth/ABI38_0_0EXAppAuth+JSON.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUtilities.h>

@implementation ABI38_0_0EXAppAuth (JSON)

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
           @"accessToken": ABI38_0_0UMNullIfNil([input accessToken]),
           @"accessTokenExpirationDate": ABI38_0_0UMNullIfNil([[self class] dateNativeToJSON:[input accessTokenExpirationDate]]),
           @"additionalParameters": ABI38_0_0UMNullIfNil([input additionalParameters]),
           @"idToken": ABI38_0_0UMNullIfNil([input idToken]),
           @"tokenType": ABI38_0_0UMNullIfNil([input tokenType]),
           };
}


@end
