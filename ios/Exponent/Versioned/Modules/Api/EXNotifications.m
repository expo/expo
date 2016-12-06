// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXNotifications.h"
#import "EXUnversioned.h"
#import "RCTUtils.h"
#import "RCTConvert.h"

@implementation RCTConvert (NSCalendarUnit)

RCT_ENUM_CONVERTER(NSCalendarUnit,
                   (@{
                      @"year": @(NSCalendarUnitYear),
                      @"month": @(NSCalendarUnitMonth),
                      @"week": @(NSCalendarUnitWeekOfYear),
                      @"day": @(NSCalendarUnitDay),
                      @"hour": @(NSCalendarUnitHour),
                      @"minute": @(NSCalendarUnitMinute)
                      }),
                   0,
                   integerValue);

@end

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

RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [RCTSharedApplication() presentLocalNotificationNow:notification];

  resolve(notification.userInfo[@"id"]);
}

RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [RCTSharedApplication() scheduleLocalNotification:notification];

  resolve(notification.userInfo[@"id"]);
}

RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  for (UILocalNotification *notification in [RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
      [RCTSharedApplication() cancelLocalNotification:notification];
      break;
    }
  }
}

RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:_experienceId]) {
      [RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": _experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
