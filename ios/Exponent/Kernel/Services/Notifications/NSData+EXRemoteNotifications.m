// Copyright 2015-present 650 Industries. All rights reserved.

#import "NSData+EXRemoteNotifications.h"

NS_ASSUME_NONNULL_BEGIN

@implementation NSData (EXRemoteNotifications)

- (NSString *)apnsTokenString
{
  const char *data = self.bytes;
  NSMutableString *token = [NSMutableString string];
  
  for (NSUInteger i = 0; i < self.length; i++) {
    [token appendFormat:@"%02.2hhx", data[i]];
  }
  
  return [token copy];
}

@end

NS_ASSUME_NONNULL_END
