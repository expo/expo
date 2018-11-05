// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXNotifications.h"
#import "ABI26_0_0EXConstants.h"
#import "ABI26_0_0EXUnversioned.h"
#import "ABI26_0_0EXUtil.h"

#import <ReactABI26_0_0/ABI26_0_0RCTUtils.h>
#import <ReactABI26_0_0/ABI26_0_0RCTConvert.h>

@implementation ABI26_0_0RCTConvert (NSCalendarUnit)

ABI26_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI26_0_0EXNotifications ()

// unversioned ABI26_0_0EXRemoteNotificationManager instance
@property (nonatomic, weak) id <ABI26_0_0EXNotificationsScopedModuleDelegate> kernelNotificationsDelegate;

@end

@implementation ABI26_0_0EXNotifications

ABI26_0_0EX_EXPORT_SCOPED_MODULE(ExponentNotifications, RemoteNotificationManager);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI26_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelNotificationsDelegate = kernelServiceInstance;
  }
  return self;
}

ABI26_0_0RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenWithConfig: (__unused NSDictionary *)config
                 resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  if (![_bridge.scopedModules.constants.appOwnership isEqualToString:@"standalone"]) {
    return reject(0, @"getDevicePushTokenAsync is only accessible within standalone applications", nil);
  }
  
  NSString *token = [_kernelNotificationsDelegate apnsTokenStringForScopedModule:self];
  if (!token) {
    return reject(0, @"APNS token has not been set", nil);
  }
  return resolve(@{ @"type": @"apns", @"data": token });
}

ABI26_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  if (!self.experienceId) {
    reject(@"E_NOTIFICATIONS_INTERNAL_ERROR", @"The notifications module is missing the current project's ID", nil);
    return;
  }

  [_kernelNotificationsDelegate getExpoPushTokenForScopedModule:self completionHandler:^(NSString *pushToken, NSError *error) {
    if (error) {
      reject(@"E_NOTIFICATIONS_TOKEN_REGISTRATION_FAILED", error.localizedDescription, error);
    } else {
      resolve(pushToken);
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    [ABI26_0_0RCTSharedApplication() presentLocalNotificationNow:notification];
  }];

  resolve(notification.userInfo[@"id"]);
}

ABI26_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI26_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI26_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    [ABI26_0_0RCTSharedApplication() scheduleLocalNotification:notification];
  }];

  resolve(notification.userInfo[@"id"]);
}

ABI26_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    for (UILocalNotification *notification in [ABI26_0_0RCTSharedApplication() scheduledLocalNotifications]) {
      if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
        [ABI26_0_0RCTSharedApplication() cancelLocalNotification:notification];
        break;
      }
    }
  }];
}

ABI26_0_0RCT_REMAP_METHOD(cancelAllScheduledNotifications,
                 cancelAllScheduledNotificationsWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI26_0_0RCTPromiseRejectBlock)reject)
{
  [self cancelAllScheduledNotificationsAsyncWithResolver:resolve rejecter:reject];
}

ABI26_0_0RCT_REMAP_METHOD(cancelAllScheduledNotificationsAsync,
                 cancelAllScheduledNotificationsAsyncWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    for (UILocalNotification *notification in [ABI26_0_0RCTSharedApplication() scheduledLocalNotifications]) {
      if ([notification.userInfo[@"experienceId"] isEqualToString:self.experienceId]) {
        [ABI26_0_0RCTSharedApplication() cancelLocalNotification:notification];
      }
    }
  }];
  resolve(nil);
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

ABI26_0_0RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  __block NSInteger badgeNumber;
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    badgeNumber = ABI26_0_0RCTSharedApplication().applicationIconBadgeNumber;
  }];
  resolve(@(badgeNumber));
}

ABI26_0_0RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(ABI26_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI26_0_0RCTPromiseRejectBlock)reject)
{
  [ABI26_0_0EXUtil performSynchronouslyOnMainThread:^{
    ABI26_0_0RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  }];
  resolve(nil);
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  ABI26_0_0RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI26_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": self.experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
