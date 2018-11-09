// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXNotifications.h"
#import "EXModuleRegistryBinding.h"
#import "EXUnversioned.h"
#import "EXUtil.h"
#import "EXEnvironment.h"
#import "EXUserNotificationCenter.h"

#import <React/RCTUtils.h>
#import <React/RCTConvert.h>

#import <EXConstantsInterface/EXConstantsInterface.h>

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
@property (nonatomic, weak) id <EXNotificationsScopedModuleDelegate> kernelNotificationsDelegate;

@end

@implementation EXNotifications

EX_EXPORT_SCOPED_MODULE(ExponentNotifications, RemoteNotificationManager);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
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

RCT_REMAP_METHOD(getDevicePushTokenAsync,
                 getDevicePushTokenWithConfig: (__unused NSDictionary *)config
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  id<EXConstantsInterface> constants = [_bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];

  if (![constants.appOwnership isEqualToString:@"standalone"]) {
    return reject(0, @"getDevicePushTokenAsync is only accessible within standalone applications", nil);
  }

  NSString *token = [_kernelNotificationsDelegate apnsTokenStringForScopedModule:self];
  if (!token) {
    return reject(0, @"APNS token has not been set", nil);
  }
  return resolve(@{ @"type": @"apns", @"data": token });
}

RCT_REMAP_METHOD(getExponentPushTokenAsync,
                 getExponentPushTokenAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
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

RCT_EXPORT_METHOD(presentLocalNotification:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  if (!payload[@"data"]) {
    reject(@"E_NOTIF_NO_DATA", @"Attempted to send a local notification with no `data` property.", nil);
    return;
  }
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[self scopedIdForIdentifier:content.userInfo[@"id"]]
                                                                        content:content
                                                                        trigger:nil];

  [[EXUserNotificationCenter sharedInstance] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error != nil) {
      reject(@"E_NOTIF", [NSString stringWithFormat:@"Could not add a notification request: %@", error.localizedDescription], error);
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
  UNCalendarNotificationTrigger *notificationTrigger = [self notificationTriggerFor:options[@"time"] repeatingEvery:options[@"repeat"]];
  UNMutableNotificationContent *content = [self _localNotificationFromPayload:payload];
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[self scopedIdForIdentifier:content.userInfo[@"id"]]
                                                                        content:content
                                                                        trigger:notificationTrigger];
  [[EXUserNotificationCenter sharedInstance] addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      reject(@"E_NOTIF_REQ", error.localizedDescription, error);
    } else {
      resolve(content.userInfo[@"id"]);
    }
  }];
}

RCT_EXPORT_METHOD(cancelScheduledNotification:(NSString *)uniqueId)
{
  [[EXUserNotificationCenter sharedInstance] removePendingNotificationRequestsWithIdentifiers:@[[self scopedIdForIdentifier:uniqueId]]];
}

RCT_REMAP_METHOD(cancelAllScheduledNotificationsAsync,
                 cancelAllScheduledNotificationsAsyncWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  [[EXUserNotificationCenter sharedInstance] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSString *> *requestsToCancelIdentifiers = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      if ([request.content.userInfo[@"experienceId"] isEqualToString:self.experienceId]) {
        NSString *scopedId = [self scopedIdForIdentifier:request.content.userInfo[@"id"]];
        [requestsToCancelIdentifiers addObject:scopedId];
      }
    }
    [[EXUserNotificationCenter sharedInstance] removePendingNotificationRequestsWithIdentifiers:requestsToCancelIdentifiers];
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

  UNNotificationCategory *newCategory = [UNNotificationCategory categoryWithIdentifier:[self scopedIdForIdentifier:categoryId]
                                                                               actions:actionsArray
                                                                     intentIdentifiers:@[]
                                                                               options:UNNotificationCategoryOptionNone];

  [[EXUserNotificationCenter sharedInstance] getNotificationCategoriesWithCompletionHandler:^(NSSet<UNNotificationCategory *> *categories) {
    NSMutableSet<UNNotificationCategory *> *newCategories = [categories mutableCopy];
    for (UNNotificationCategory *category in newCategories) {
      if ([category.identifier isEqualToString:newCategory.identifier]) {
        [newCategories removeObject:category];
        break;
      }
    }
    [newCategories addObject:newCategory];
    [[EXUserNotificationCenter sharedInstance] setNotificationCategories:newCategories];
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
    content.categoryIdentifier = [self scopedIdForIdentifier:payload[@"categoryId"]];
  }

  content.userInfo = @{
                       @"body": payload[@"data"],
                       @"experienceId": self.experienceId,
                       @"id": uniqueId
                       };

  return content;
}

- (NSString *)scopedIdForIdentifier:(NSString *)identifier {
  return [NSString stringWithFormat:@"%@:%@", self.experienceId, identifier];
}

- (UNCalendarNotificationTrigger *)notificationTriggerFor:(NSNumber * _Nullable)unixTime repeatingEvery:(NSString * _Nullable)timePeriod
{
  NSDateComponents *dateComponents = [self dateComponentsFrom:unixTime];
  if (timePeriod) {
    NSCalendarUnit timePeriodToRepeat = [RCTConvert NSCalendarUnit:timePeriod];
    [self mutateDateComponents:dateComponents toRepeatEvery:timePeriodToRepeat];
    return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:YES];
  }

  return [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:NO];
}

- (NSDateComponents *)dateComponentsFrom:(NSNumber * _Nullable)unixTime {
  static unsigned unitFlags = NSCalendarUnitSecond | NSCalendarUnitMinute | NSCalendarUnitHour | NSCalendarUnitDay | NSCalendarUnitMonth |  NSCalendarUnitYear;
  NSDate *triggerDate = [RCTConvert NSDate:unixTime] ?: [NSDate new];
  NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSCalendarIdentifierGregorian];
  return [calendar components:unitFlags fromDate:triggerDate];
}

- (void)mutateDateComponents:(NSDateComponents *)dateComponents toRepeatEvery:(NSCalendarUnit)timePeriod
{
  switch (timePeriod) {
    case NSCalendarUnitMinute:
      dateComponents.minute = NSDateComponentUndefined;
    case NSCalendarUnitHour:
      dateComponents.hour = NSDateComponentUndefined;
    case NSCalendarUnitDay:
      dateComponents.day = NSDateComponentUndefined;
    case NSCalendarUnitWeekOfYear:
      dateComponents.weekOfYear = NSDateComponentUndefined;
    case NSCalendarUnitMonth:
      dateComponents.month = NSDateComponentUndefined;
    case NSCalendarUnitYear:
      dateComponents.year = NSDateComponentUndefined;
    default:
      return;
  }

  return [self mutateDateComponents:dateComponents toRepeatEvery:timePeriod - 1];
}

- (UNNotificationAction *)parseNotificationActionFromParams:(NSDictionary *)params
{
  NSString *actionId = params[@"actionId"];
  NSString *buttonTitle = params[@"buttonTitle"];

  UNNotificationActionOptions options = UNNotificationActionOptionForeground;
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
