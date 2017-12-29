// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXNotifications.h"
#import "ABI21_0_0EXConstants.h"
#import "ABI21_0_0EXUnversioned.h"

#import <ReactABI21_0_0/ABI21_0_0RCTUtils.h>
#import <ReactABI21_0_0/ABI21_0_0RCTConvert.h>

@implementation ABI21_0_0RCTConvert (NSCalendarUnit)

ABI21_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI21_0_0EXNotifications ()

// unversioned ABI21_0_0EXRemoteNotificationManager instance
@property (nonatomic, weak) id <ABI21_0_0EXNotificationsScopedModuleDelegate> kernelNotificationsDelegate;

@end

@implementation ABI21_0_0EXNotifications

ABI21_0_0EX_EXPORT_SCOPED_MODULE(ExponentNotifications, RemoteNotificationManager);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI21_0_0RCTBridge *)bridge
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

ABI21_0_0RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenAsyncWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
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

ABI21_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI21_0_0RCTPromiseRejectBlock)reject)
{
  if (!self.experienceId) {
    reject(0, @"Requires experience Id", nil);
    return;
  }
  void (^success)(NSDictionary *) = ^(NSDictionary *result) {
    resolve([result objectForKey:@"exponentPushToken"]);
  };
  void (^failure)(NSString *) = ^(NSString *message) {
    reject(0, message, nil);
  };
  [_kernelNotificationsDelegate getExpoPushTokenForScopedModule:self
                                                        success:success
                                                        failure:failure];
}

ABI21_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI21_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [self _performSynchronouslyOnMainThread:^{
    [ABI21_0_0RCTSharedApplication() presentLocalNotificationNow:notification];
  }];

  resolve(notification.userInfo[@"id"]);
}

ABI21_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI21_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI21_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI21_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [self _performSynchronouslyOnMainThread:^{
    [ABI21_0_0RCTSharedApplication() scheduleLocalNotification:notification];
  }];

  resolve(notification.userInfo[@"id"]);
}

ABI21_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  [self _performSynchronouslyOnMainThread:^{
    for (UILocalNotification *notification in [ABI21_0_0RCTSharedApplication() scheduledLocalNotifications]) {
      if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
        [ABI21_0_0RCTSharedApplication() cancelLocalNotification:notification];
        break;
      }
    }
  }];
}

ABI21_0_0RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [ABI21_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:self.experienceId]) {
      [self _performSynchronouslyOnMainThread:^{
        [ABI21_0_0RCTSharedApplication() cancelLocalNotification:notification];
      }];
    }
  }
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

ABI21_0_0RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI21_0_0RCTPromiseRejectBlock)reject)
{
  __block NSInteger badgeNumber;
  [self _performSynchronouslyOnMainThread:^{
    badgeNumber = ABI21_0_0RCTSharedApplication().applicationIconBadgeNumber;
  }];
  resolve(@(badgeNumber));
}

ABI21_0_0RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(ABI21_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI21_0_0RCTPromiseRejectBlock)reject)
{
  [self _performSynchronouslyOnMainThread:^{
    ABI21_0_0RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  }];
  resolve(nil);
}

#pragma mark - internal

- (void)_performSynchronouslyOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_sync(dispatch_get_main_queue(), block);
  }
}

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  ABI21_0_0RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI21_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": self.experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
