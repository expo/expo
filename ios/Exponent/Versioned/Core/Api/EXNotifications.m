// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXNotifications.h"
#import "EXModuleRegistryBinding.h"
#import "EXUnversioned.h"
#import "EXUtil.h"

#import <React/RCTUtils.h>
#import <React/RCTConvert.h>

#import "EXConstantsBinding.h"

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

// unversioned EXRemoteNotificationManager instance
@property (nonatomic, weak) id <EXNotificationsScopedModuleDelegate> remoteNotificationsDelegate;
@property (nonatomic, weak) id <EXNotificationsIdentifiersManager> notificationsIdentifiersManager;
@property (nonatomic, weak) id <EXUserNotificationCenterService> userNotificationCenter;

@end

@implementation EXNotifications

EX_EXPORT_SCOPED_MULTISERVICE_MODULE(ExponentNotifications, @"RemoteNotificationManager", @"UserNotificationManager", @"UserNotificationCenter");

@synthesize bridge = _bridge;
@synthesize methodQueue = _methodQueue;

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegates:(NSDictionary *)kernelServiceInstances params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegates:kernelServiceInstances params:params]) {
    _userNotificationCenter = kernelServiceInstances[@"UserNotificationCenter"];
    _remoteNotificationsDelegate = kernelServiceInstances[@"RemoteNotificationManager"];
    _notificationsIdentifiersManager = kernelServiceInstances[@"UserNotificationManager"];
  }
  return self;
}

RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenWithConfig: (__unused NSDictionary *)config
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  EXConstantsBinding *constants = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(UMConstantsInterface)];

  if (![constants.appOwnership isEqualToString:@"standalone"]) {
    return reject(0, @"getDevicePushTokenAsync is only accessible within standalone applications", nil);
  }

  [_remoteNotificationsDelegate getApnsTokenForScopedModule:self completionHandler:^(NSString * _Nullable apnsToken, NSError * _Nullable error) {
    if (error) {
      reject(@"ERR_NOTIFICATIONS_PUSH_REGISTRATION_FAILED", error.localizedDescription, error);
    } else {
      resolve(@{ @"type": @"apns", @"data": apnsToken });
    }
  }];
}

RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!self.experienceId) {
    reject(@"E_NOTIFICATIONS_INTERNAL_ERROR", @"The notifications module is missing the current project's ID", nil);
    return;
  }

  [_remoteNotificationsDelegate getExpoPushTokenForScopedModule:self completionHandler:^(NSString *pushToken, NSError *error) {
    if (error) {
      reject(@"E_NOTIFICATIONS_TOKEN_REGISTRATION_FAILED", error.localizedDescription, error);
    } else {
      resolve(pushToken);
    }
  }];
}

RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                        content:content
                                                                        trigger:nil];

  [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF", [NSString stringWithFormat:@"Could not add a notification request: %@", error.localizedDescription], error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}


  RCT_EXPORT_METHOD(scheduleNotificationWithTimer:(NSDictionary *)payload
                   withOptions:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
 if (!payload[@"data"]) {
   reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
   return;
 }
 BOOL repeats = [options[@"repeat"] boolValue];
 int seconds = [options[@"interval"] intValue] / 1000;
 UNTimeIntervalNotificationTrigger *notificationTrigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:seconds repeats:repeats];
 UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
 UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                       content:content
                                                                       trigger:notificationTrigger];
 [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
   if (error) {
     reject(@"E_NOTIF_REQ", error.localizedDescription, error);
   } else {
     resolve(content.userInfo[@"id"]);
   }
 }];
}

RCT_EXPORT_METHOD(scheduleNotificationWithCalendar:(NSDictionary *)payload
                 withOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
 if (!payload[@"data"]) {
   reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
   return;
 }
 UNCalendarNotificationTrigger *notificationTrigger = [self calendarTriggerFrom:options];
 UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
 UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                       content:content
                                                                       trigger:notificationTrigger];
 [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
   if (error) {
     reject(@"E_NOTIF_REQ", error.localizedDescription, error);
   } else {
     resolve(content.userInfo[@"id"]);
   }
 }];
}


RCT_EXPORT_METHOD(scheduleLocalNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UNCalendarNotificationTrigger *notificationTrigger = [self notificationTriggerFor:options[@"time"]];
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:content.userInfo[@"id"]
                                                                        content:content
                                                                        trigger:notificationTrigger];
  [_userNotificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF_REQ", error.localizedDescription, error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}

RCT_EXPORT_METHOD(legacyScheduleLocalRepeatingNotification:(NSDictionary *)payload
                  withOptions:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  #pragma GCC diagnostic ignored "-Wdeprecated-declarations"
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UILocalNotification *localNotification = [UILocalNotification new];
  NSString *uniqueId = [[NSUUID new] UUIDString];
  localNotification.alertTitle = payload[@"title"];
  localNotification.alertBody = payload[@"body"];
  if ([payload[@"sound"] boolValue]) {
    localNotification.soundName = UILocalNotificationDefaultSoundName;
  }
  if ([payload[@"categoryId"] isKindOfClass:[NSString class]]) {
    localNotification.category = [self internalIdForIdentifier:payload[@"categoryId"]];
  }
  localNotification.applicationIconBadgeNumber = [RCTConvert NSInteger:payload[@"count"]] ?: 0;
  localNotification.userInfo = @{
                                 @"body": payload[@"data"],
                                 @"experienceId": self.experienceId,
                                 @"id": uniqueId
                                 };
  localNotification.fireDate = [RCTConvert NSDate:options[@"time"]] ?: [NSDate new];
  localNotification.repeatInterval = [RCTConvert NSCalendarUnit:options[@"repeat"]] ?: 0;

  __weak typeof(self) weakSelf = self;
  [EXUtil performSynchronouslyOnMainThread:^{
    [RCTSharedApplication() scheduleLocalNotification:localNotification];
    dispatch_queue_t methodQueue = weakSelf.methodQueue;
    if (methodQueue) {
      dispatch_async(methodQueue, ^{
        resolve(uniqueId);
      });
    }
  }];
  #pragma GCC diagnostic warning "-Wdeprecated-declarations"
}

RCT_REMAP_METHOD(cancelScheduledNotificationAsync,
                 cancelScheduledNotificationAsync:(NSString *)uniqueId
                 withResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  __weak id<EXUserNotificationCenterService> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    for (UNNotificationRequest *request in requests) {
      if ([request.content.userInfo[@"id"] isEqualToString:uniqueId]) {
        [userNotificationCenter removePendingNotificationRequestsWithIdentifiers:@[request.identifier]];
        return resolve(nil);
      }
    }
    reject(@"E_NO_NOTIF", [NSString stringWithFormat:@"Could not find pending notification request to cancel with id = %@", uniqueId], nil);
  }];
}

RCT_REMAP_METHOD(cancelAllScheduledNotificationsAsync,
                 cancelAllScheduledNotificationsAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  __weak id<EXUserNotificationCenterService> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *requestsToCancelIdentifiers = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([request.content.userInfo[@"experienceId"] isEqualToString:self.experienceId]) {
        [requestsToCancelIdentifiers addObject:request.identifier];
      }
    }
    [userNotificationCenter removePendingNotificationRequestsWithIdentifiers:requestsToCancelIdentifiers];
    resolve(nil);
  }];
}

#pragma mark - Badges

// TODO: Make this read from the kernel instead of UIApplication for the main Exponent app

RCT_REMAP_METHOD(getBadgeNumberAsync,
                 getBadgeNumberAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  __block NSInteger badgeNumber;
  [EXUtil performSynchronouslyOnMainThread:^{
    badgeNumber = RCTSharedApplication().applicationIconBadgeNumber;
  }];
  resolve(@(badgeNumber));
}

RCT_EXPORT_METHOD(setBadgeNumberAsync:(nonnull NSNumber *)number
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  [EXUtil performSynchronouslyOnMainThread:^{
    RCTSharedApplication().applicationIconBadgeNumber = number.integerValue;
  }];
  resolve(nil);
}

# pragma mark - Categories

RCT_REMAP_METHOD(createCategoryAsync,
                 createCategoryWithCategoryId:(NSString *)categoryId
                 actions:(NSArray *)actions
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  NSMutableArray<UNNotificationAction *> *actionsArray = [[NSMutableArray alloc] init];
  for (NSDictionary<NSString *, id> *actionParams in actions) {
    [actionsArray addObject:[self parseNotificationActionFromParams:actionParams]];
  }

  UNNotificationCategory *newCategory = [UNNotificationCategory categoryWithIdentifier:[self internalIdForIdentifier:categoryId]
                                                                               actions:actionsArray
                                                                     intentIdentifiers:@[]
                                                                               options:UNNotificationCategoryOptionNone];

  __weak id<EXUserNotificationCenterService> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [userNotificationCenter setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

RCT_REMAP_METHOD(deleteCategoryAsync,
                 deleteCategoryWithCategoryId:(NSString *)categoryId
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  NSString *internalCategoryId = [self internalIdForIdentifier:categoryId];
  __weak id<EXUserNotificationCenterService> userNotificationCenter = _userNotificationCenter;
  [_userNotificationCenter getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:internalCategoryId]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [userNotificationCenter setNotificationCategories:newCategories];
    resolve(nil);
  }];
}

#pragma mark - internal

- (UNMutableNotificationContent *)_localNotificationFromPayload:(NSDictionary *)payload
{
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];

  NSString *uniqueId = [[NSUUID new] UUIDString];

  content.title = payload[@"title"];
  content.body = payload[@"body"];

  if ([payload[@"sound"] boolValue]) {
    content.sound = [UNNotificationSound defaultSound];
  }

  if ([payload[@"count"] isKindOfClass:[NSNumber class]]) {
    content.badge = (NSNumber *)payload[@"count"];
  }

  if ([payload[@"categoryId"] isKindOfClass:[NSString class]]) {
    content.categoryIdentifier = [self internalIdForIdentifier:payload[@"categoryId"]];
  }

  content.userInfo = @{
                       @"body": payload[@"data"],
                       @"experienceId": self.experienceId,
                       @"id": uniqueId
                       };

  return content;
}

- (NSString *)internalIdForIdentifier:(NSString *)identifier {
  return [_notificationsIdentifiersManager internalIdForIdentifier:identifier experienceId:self.experienceId];
}

- (UNCalendarNotificationTrigger *)notificationTriggerFor:(NSNumber * _Nullable)unixTime
{
  NSDateComponents *dateComponents = [self dateComponentsFrom:unixTime];
  return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
}

- (NSDateComponents *)dateComponentsFrom:(NSNumber * _Nullable)unixTime {
  static unsigned unitFlags = NSCalendarUnitSecond | NSCalendarUnitMinute | NSCalendarUnitHour | NSCalendarUnitDay | NSCalendarUnitMonth |  NSCalendarUnitYear;
  NSDate *triggerDate = [RCTConvert NSDate:unixTime] ?: [NSDate new];
  NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
  return [calendar components:unitFlags fromDate:triggerDate];
}

- (UNCalendarNotificationTrigger *)calendarTriggerFrom:(NSDictionary *)options
{
 BOOL repeats = [options[@"repeat"] boolValue];

  NSDateComponents *date = [[NSDateComponents alloc] init];

  NSArray *timeUnits = @[@"year", @"day", @"weekDay", @"month", @"hour", @"second", @"minute"];

  for (NSString *timeUnit in timeUnits) {
   if (options[timeUnit]) {
     [date setValue:options[timeUnit] forKey:timeUnit];
   }
 }

  return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:date repeats:repeats];
}


- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *actionId = [self internalIdForIdentifier:params[@"actionId"]];
  NSString *buttonTitle = params[@"buttonTitle"];

  UNNotificationActionOptions options = UNNotificationActionOptionNone;
  if (![params[@"doNotOpenInForeground"] boolValue]) {
    options += UNNotificationActionOptionForeground;
  }
  if ([params[@"isDestructive"] boolValue]) {
    options += UNNotificationActionOptionDestructive;
  }
  if ([params[@"isAuthenticationRequired"] boolValue]) {
    options += UNNotificationActionOptionAuthenticationRequired;
  }

  if ([params[@"textInput"] isKindOfClass:[NSDictionary class]]) {
    return [UNTextInputNotificationAction actionWithIdentifier:actionId
                                                         title:buttonTitle
                                                       options:options
                                          textInputButtonTitle:params[@"textInput"][@"submitButtonTitle"]
                                          textInputPlaceholder:params[@"textInput"][@"placeholder"]];
  }

  return [UNNotificationAction actionWithIdentifier:actionId title:buttonTitle options:options];
}

@end
