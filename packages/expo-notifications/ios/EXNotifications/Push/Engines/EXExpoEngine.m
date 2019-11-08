// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXApiV2Client+EXRemoteNotifications.h>
#import <EXNotifications/EXExpoEngine.h>
#import <TCMobileProvision/TCMobileProvision.h>

@interface EXExpoEngine ()

@property(strong) NSNumber *inDevelopment;

@end

@implementation EXExpoEngine

- (instancetype)init {
  if (self = [super init]) {
    _inDevelopment = nil;
  }
  return self;
}

- (NSString *)generateTokenForAppId:(NSString *)appId withToken:(NSString *)token {
  [self checkIfInDevelopment];
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  __block NSString *nextExpoPushToken;
  [[EXApiV2Client sharedClient]
      getExpoPushTokenForExperience:appId
                        deviceToken:token
                  inDevelopmentMode:_inDevelopment
                  completionHandler:^(NSString *_Nullable expoPushToken, NSError *_Nullable error) {
                    nextExpoPushToken = expoPushToken;
                    dispatch_semaphore_signal(sem);
                  }];
  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
  return nextExpoPushToken;
}

- (void)sendTokenToServer:(NSString *)token {
  [self checkIfInDevelopment];
  dispatch_semaphore_t sem = dispatch_semaphore_create(0);
  [[EXApiV2Client sharedClient] updateDeviceToken:token
                                inDevelopmentMode:_inDevelopment
                                completionHandler:^(NSError *_Nullable postError) {
                                  dispatch_semaphore_signal(sem);
                                }];
  dispatch_semaphore_wait(sem, DISPATCH_TIME_FOREVER);
}

- (void)checkIfInDevelopment {
  if (_inDevelopment != nil) {
    return;
  }
  // TODO: This may not work in TestFlight (fix it)
  NSString *mobileprovisionPath = [[[NSBundle mainBundle] bundlePath]
      stringByAppendingPathComponent:@"embedded.mobileprovision"];
  TCMobileProvision *mobileprovision =
      [[TCMobileProvision alloc] initWithData:[NSData dataWithContentsOfFile:mobileprovisionPath]];
  NSDictionary *entitlements = mobileprovision.dict[@"Entitlements"];
  NSString *apsEnvironment = entitlements[@"aps-environment"];
  BOOL production =
      entitlements && apsEnvironment && [apsEnvironment isEqualToString:@"production"];
  _inDevelopment = [NSNumber numberWithBool:!production];
}

@end
