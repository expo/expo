// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXNotifications.h"
#import "EXUnversioned.h"
#import "RCTUtils.h"

@interface EXNotifications ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXNotifications

+ (NSString *)moduleName { return @"ExponentNotifications"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
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
  [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXKernelGetPushTokenNotification")
                                                      object:nil
                                                    userInfo:@{
                                                               @"experienceId": _experienceId,
                                                               @"onSuccess": success,
                                                               @"onFailure": failure,
                                                               }];
}

RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload)
{
  UILocalNotification *localNotification = [UILocalNotification new];
  
  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  [RCTSharedApplication() presentLocalNotificationNow:localNotification];
}

@end
