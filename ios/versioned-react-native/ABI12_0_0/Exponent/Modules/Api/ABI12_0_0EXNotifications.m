// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXNotifications.h"
#import "ABI12_0_0EXUnversioned.h"
#import "ABI12_0_0RCTUtils.h"
#import "ABI12_0_0RCTConvert.h"

@implementation ABI12_0_0RCTConvert (NSCalendarUnit)

ABI12_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI12_0_0EXNotifications ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI12_0_0EXNotifications

+ (NSString *)moduleName { return @"ExponentNotifications"; }

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

ABI12_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI12_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI12_0_0RCTPromiseRejectBlock)reject)
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

ABI12_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI12_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI12_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [ABI12_0_0RCTSharedApplication() presentLocalNotificationNow:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI12_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI12_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI12_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI12_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI12_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [ABI12_0_0RCTSharedApplication() scheduleLocalNotification:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI12_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  for (UILocalNotification *notification in [ABI12_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
      [ABI12_0_0RCTSharedApplication() cancelLocalNotification:notification];
      break;
    }
  }
}

ABI12_0_0RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [ABI12_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:_experienceId]) {
      [ABI12_0_0RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI12_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": _experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
