// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXNotifications.h"
#import "ABI18_0_0EXUnversioned.h"
#import "ABI18_0_0EXScope.h"

#import <ReactABI18_0_0/ABI18_0_0RCTUtils.h>
#import <ReactABI18_0_0/ABI18_0_0RCTConvert.h>

@implementation ABI18_0_0RCTConvert (NSCalendarUnit)

ABI18_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI18_0_0EXNotifications ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI18_0_0EXNotifications

ABI18_0_0RCT_EXPORT_MODULE(ExponentNotifications);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI18_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _experienceId = _bridge.experienceScope.experienceId;
}


ABI18_0_0RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenAsyncWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
{
  if (![_bridge.experienceScope.appOwnership isEqualToString:@"standalone"]) {
    return reject(0, @"getDevicePushTokenAsync is only accessible within standalone applications", nil);
  }
  
  NSString *token = _bridge.experienceScope.apnsToken;
  if (!token) {
    return reject(0, @"APNS token has not been set", nil);
  }
  return resolve(@{ @"type": @"apns", @"data": token });
}

ABI18_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI18_0_0RCTPromiseRejectBlock)reject)
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

ABI18_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI18_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [ABI18_0_0RCTSharedApplication() presentLocalNotificationNow:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI18_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI18_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI18_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI18_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [ABI18_0_0RCTSharedApplication() scheduleLocalNotification:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI18_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  for (UILocalNotification *notification in [ABI18_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
      [ABI18_0_0RCTSharedApplication() cancelLocalNotification:notification];
      break;
    }
  }
}

ABI18_0_0RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [ABI18_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:_experienceId]) {
      [ABI18_0_0RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

ABI18_0_0RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI18_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@(ABI18_0_0RCTSharedApplication().applicationIconBadgeNumber));
}

ABI18_0_0RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(ABI18_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI18_0_0RCTPromiseRejectBlock)reject)
{
  ABI18_0_0RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  resolve(nil);
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  ABI18_0_0RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI18_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": _experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
