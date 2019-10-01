// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedNotifications.h"
#import "EXApiV2Client+EXRemoteNotifications.h"

@interface EXScopedNotifications ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, strong) NSString *deviceToken;

@end

@implementation EXScopedNotifications

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

UM_EXPORT_METHOD_AS(getExpoPushTokenAsync,
                    getExponentPushTokenAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [self registerForPushNotificationsAsync:^(id result) {
    [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:_experienceId deviceToken:_deviceToken inDevelopmentMode:NO completionHandler:^(NSString * _Nullable expoPushToken, NSError * _Nullable error) {
      resolve(expoPushToken);
    }];
  } rejecter:reject];
}

- (void)onNewToken:(NSData *)deviceToken
{
  [super onNewToken:deviceToken];
  const char *data = [deviceToken bytes];
  NSMutableString *token = [NSMutableString string];

  for (NSUInteger i = 0; i < [deviceToken length]; i++) {
    [token appendFormat:@"%02.2hhX", data[i]];
  }
  [[EXApiV2Client sharedClient] updateDeviceToken:token inDevelopmentMode:NO completionHandler:^(NSError * _Nullable postError) {
    _deviceToken = token;
  }];
}

@end
