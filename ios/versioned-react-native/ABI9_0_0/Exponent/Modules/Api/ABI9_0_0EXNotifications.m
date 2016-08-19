// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXNotifications.h"

@interface ABI9_0_0EXNotifications ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI9_0_0EXNotifications

+ (NSString *)moduleName { return @"ExponentNotifications"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

ABI9_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI9_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI9_0_0RCTPromiseRejectBlock)reject)
{
  if (!_experienceId) {
    reject(0, @"Requires experience Id", nil);
    return;
  }

  void (^success)(NSDictionary *) = ^(NSDictionary *result) {
    resolve([result objectForKey:@"exponentPushToken"]);
  };
  void (^failure)(NSString *) = ^(NSString *message) {
    reject(0, message, nil);
  };
  [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelGetPushTokenNotification"
                                                      object:nil
                                                    userInfo:@{
                                                               @"experienceId": _experienceId,
                                                               @"onSuccess": success,
                                                               @"onFailure": failure,
                                                               }];
}

@end
