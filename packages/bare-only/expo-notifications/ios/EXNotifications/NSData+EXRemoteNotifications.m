// Copyright 2015-present 650 Industries. All rights reserved.

#import "NSData+EXRemoteNotifications.h"

NS_ASSUME_NONNULL_BEGIN

@implementation NSData (EXRemoteNotifications)

- (NSString *)apnsTokenString
{
  return [self stringWithDeviceToken:self];
}

- (NSString *)stringWithDeviceToken:(NSData *)deviceToken {
  const char *data = [deviceToken bytes];
  NSMutableString *token = [NSMutableString string];
  
  for (NSUInteger i = 0; i < [deviceToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }
  
  return [token copy];
}

@end

NS_ASSUME_NONNULL_END
