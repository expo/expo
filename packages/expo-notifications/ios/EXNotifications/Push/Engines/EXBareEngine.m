// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBareEngine.h>

@implementation EXBareEngine

- (NSString *)generateTokenForAppId:(NSString *)appId withToken:(NSString *)token {
  return token;
}

- (void)sendTokenToServer:(NSString *)token {
  // no-op
}

@end
