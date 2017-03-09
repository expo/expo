// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXNotifications.h"
#import "ABI15_0_0EXUnversioned.h"
#import "ABI15_0_0EXScope.h"
#import <ReactABI15_0_0/ABI15_0_0RCTUtils.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert.h>

@implementation ABI15_0_0RCTConvert (NSCalendarUnit)

ABI15_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI15_0_0EXNotifications ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI15_0_0EXNotifications

ABI15_0_0RCT_EXPORT_MODULE(ExponentNotifications);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI15_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _experienceId = _bridge.experienceScope.experienceId;
}

ABI15_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI15_0_0RCTPromiseRejectBlock)reject)
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

ABI15_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI15_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [ABI15_0_0RCTSharedApplication() presentLocalNotificationNow:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI15_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI15_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI15_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI15_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [ABI15_0_0RCTSharedApplication() scheduleLocalNotification:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI15_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  for (UILocalNotification *notification in [ABI15_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
      [ABI15_0_0RCTSharedApplication() cancelLocalNotification:notification];
      break;
    }
  }
}

ABI15_0_0RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [ABI15_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:_experienceId]) {
      [ABI15_0_0RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

ABI15_0_0RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI15_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@(ABI15_0_0RCTSharedApplication().applicationIconBadgeNumber));
}

ABI15_0_0RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(ABI15_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI15_0_0RCTPromiseRejectBlock)reject)
{
  ABI15_0_0RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  resolve(nil);
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  ABI15_0_0RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI15_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": _experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
