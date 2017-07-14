// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXNotifications.h"
#import "ABI19_0_0EXConstants.h"
#import "ABI19_0_0EXUnversioned.h"

#import <ReactABI19_0_0/ABI19_0_0RCTUtils.h>
#import <ReactABI19_0_0/ABI19_0_0RCTConvert.h>

@implementation ABI19_0_0RCTConvert (NSCalendarUnit)

ABI19_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
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

@interface ABI19_0_0EXNotifications ()

// unversioned ABI19_0_0EXRemoteNotificationManager instance
@property (nonatomic, weak) id <ABI19_0_0EXNotificationsScopedModuleDelegate> kernelNotificationsDelegate;

@end

@implementation ABI19_0_0EXNotifications

ABI19_0_0EX_EXPORT_SCOPED_MODULE(ExponentNotifications, RemoteNotificationManager);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI19_0_0RCTBridge *)bridge
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

ABI19_0_0RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenAsyncWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject)
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

ABI19_0_0RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI19_0_0RCTPromiseRejectBlock)reject)
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

ABI19_0_0RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI19_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  [ABI19_0_0RCTSharedApplication() presentLocalNotificationNow:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI19_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI19_0_0RCTPromiseRejectBlock)reject)
{
  UILocalNotification *notification = [self _localNotificationFromPayload:payload];

  notification.fireDate = [ABI19_0_0RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  notification.repeatInterval = [ABI19_0_0RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  [ABI19_0_0RCTSharedApplication() scheduleLocalNotification:notification];

  resolve(notification.userInfo[@"id"]);
}

ABI19_0_0RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  for (UILocalNotification *notification in [ABI19_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"id"] isEqualToString:uniqueId]) {
      [ABI19_0_0RCTSharedApplication() cancelLocalNotification:notification];
      break;
    }
  }
}

ABI19_0_0RCT_EXPORT_METHOD(cancelAllScheduledNotifications)
{
  for (UILocalNotification *notification in [ABI19_0_0RCTSharedApplication() scheduledLocalNotifications]) {
    if ([notification.userInfo[@"experienceId"] isEqualToString:self.experienceId]) {
      [ABI19_0_0RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

ABI19_0_0RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(__unused ABI19_0_0RCTPromiseRejectBlock)reject)
{
  resolve(@(ABI19_0_0RCTSharedApplication().applicationIconBadgeNumber));
}

ABI19_0_0RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(ABI19_0_0RCTPromiseResolveBlock)resolve
                  rejecter:(__unused ABI19_0_0RCTPromiseRejectBlock)reject)
{
  ABI19_0_0RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  resolve(nil);
}

#pragma mark - internal

- (UILocalNotification *)_localNotificationFromPayload:(NSDictionary *)payload
{
  ABI19_0_0RCTAssert((payload[@"data"] != nil), @"Attempted to send a local notification with no `data` property.");
  UILocalNotification *localNotification = [UILocalNotification new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  
  localNotification.applicationIconBadgeNumber = [ABI19_0_0RCTConvert NSInteger:payload[@"count"]] ?: 0;

  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": self.experienceId,
                                 @"id": uniqueId,
                                 };

  return localNotification;
}

@end
