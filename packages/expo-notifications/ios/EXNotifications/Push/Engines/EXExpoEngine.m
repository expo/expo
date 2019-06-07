// Copyright 2019-present 650 Industries. All rights reserved.

#import "EXExpoEngine.h"
#import <EXNotifications/EXApiV2Client+EXRemoteNotifications.h>

@interface EXExpoEngine ()

@end

@implementation EXExpoEngine

- (instancetype)init
{
  if (self = [super init])
  {
    
  }
  return self;
}

- (NSString *)generateTokenForAppId:(NSString *)appId withToken:(NSString *)token
{
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block NSString *nextExpoPushToken;
  [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:appId deviceToken:token completionHandler:^(NSString * _Nullable expoPushToken, NSError * _Nullable error) {
    nextExpoPushToken = expoPushToken;
    dispatch_semaphore_signal(sem);
  }];
  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
  return nextExpoPushToken;
}

- (void)sendTokenToServer:(NSString *)token
{
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  [[EXApiV2Client sharedClient] updateDeviceToken:token completionHandler:^(NSError * _Nullable postError) {
    dispatch_semaphore_signal(sem);
  }];
  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
}

@end
