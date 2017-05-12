/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTPushNotificationManager.h"

#import <UserNotifications/UserNotifications.h>

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventDispatcher.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUtils.h>

NSString *const ABI17_0_0RCTLocalNotificationReceived = @"LocalNotificationReceived";
NSString *const ABI17_0_0RCTRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const ABI17_0_0RCTRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
NSString *const ABI17_0_0RCTRegisterUserNotificationSettings = @"RegisterUserNotificationSettings";

NSString *const ABI17_0_0RCTErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";
NSString *const ABI17_0_0RCTErrorRemoteNotificationRegistrationFailed = @"E_FAILED_TO_REGISTER_FOR_REMOTE_NOTIFICATIONS";

#if !TARGET_OS_TV
@implementation ABI17_0_0RCTConvert (NSCalendarUnit)

ABI17_0_0RCT_ENUM_CONVERTER(NSCalendarUnit,
                   (@{
                      @"year": @(NSCalendarUnitYear),
                      @"month": @(NSCalendarUnitMonth),
                      @"week": @(NSCalendarUnitWeekOfYear),
                      @"day": @(NSCalendarUnitDay),
                      @"hour": @(NSCalendarUnitHour),
                      @"minute": @(NSCalendarUnitMinute)
                      }),
                   0,
                   integerValue)

@end

@interface ABI17_0_0RCTPushNotificationManager ()
@property (nonatomic, strong) NSMutableDictionary *remoteNotificationCallbacks;
@end

@implementation ABI17_0_0RCTConvert (UILocalNotification)

+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  UILocalNotification *notification = [UILocalNotification new];
  notification.fireDate = [ABI17_0_0RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.alertBody = [ABI17_0_0RCTConvert NSString:details[@"alertBody"]];
  notification.alertAction = [ABI17_0_0RCTConvert NSString:details[@"alertAction"]];
  notification.soundName = [ABI17_0_0RCTConvert NSString:details[@"soundName"]] ?: UILocalNotificationDefaultSoundName;
  notification.userInfo = [ABI17_0_0RCTConvert NSDictionary:details[@"userInfo"]];
  notification.category = [ABI17_0_0RCTConvert NSString:details[@"category"]];
  notification.repeatInterval = [ABI17_0_0RCTConvert NSCalendarUnit:details[@"repeatInterval"]];
  if (details[@"applicationIconBadgeNumber"]) {
    notification.applicationIconBadgeNumber = [ABI17_0_0RCTConvert NSInteger:details[@"applicationIconBadgeNumber"]];
  }
  return notification;
}

ABI17_0_0RCT_ENUM_CONVERTER(UIBackgroundFetchResult, (@{
  @"UIBackgroundFetchResultNewData": @(UIBackgroundFetchResultNewData),
  @"UIBackgroundFetchResultNoData": @(UIBackgroundFetchResultNoData),
  @"UIBackgroundFetchResultFailed": @(UIBackgroundFetchResultFailed),
}), UIBackgroundFetchResultNoData, integerValue)

@end
#endif //TARGET_OS_TV

@implementation ABI17_0_0RCTPushNotificationManager
{
  ABI17_0_0RCTPromiseResolveBlock _requestPermissionsResolveBlock;
}

#if !TARGET_OS_TV

static NSDictionary *ABI17_0_0RCTFormatLocalNotification(UILocalNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.fireDate) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.fireDate];
    formattedLocalNotification[@"fireDate"] = fireDateString;
  }
  formattedLocalNotification[@"alertAction"] = ABI17_0_0RCTNullIfNil(notification.alertAction);
  formattedLocalNotification[@"alertBody"] = ABI17_0_0RCTNullIfNil(notification.alertBody);
  formattedLocalNotification[@"applicationIconBadgeNumber"] = @(notification.applicationIconBadgeNumber);
  formattedLocalNotification[@"category"] = ABI17_0_0RCTNullIfNil(notification.category);
  formattedLocalNotification[@"soundName"] = ABI17_0_0RCTNullIfNil(notification.soundName);
  formattedLocalNotification[@"userInfo"] = ABI17_0_0RCTNullIfNil(ABI17_0_0RCTJSONClean(notification.userInfo));
  formattedLocalNotification[@"remote"] = @NO;
  return formattedLocalNotification;
}

static NSDictionary *ABI17_0_0RCTFormatUNNotification(UNNotification *notification)
{
  NSMutableDictionary *formattedNotification = [NSMutableDictionary dictionary];
  UNNotificationContent *content = notification.request.content;

  formattedNotification[@"identifier"] = notification.request.identifier;

  if (notification.date) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *dateString = [formatter stringFromDate:notification.date];
    formattedNotification[@"date"] = dateString;
  }

  formattedNotification[@"title"] = ABI17_0_0RCTNullIfNil(content.title);
  formattedNotification[@"body"] = ABI17_0_0RCTNullIfNil(content.body);
  formattedNotification[@"category"] = ABI17_0_0RCTNullIfNil(content.categoryIdentifier);
  formattedNotification[@"thread-id"] = ABI17_0_0RCTNullIfNil(content.threadIdentifier);
  formattedNotification[@"userInfo"] = ABI17_0_0RCTNullIfNil(ABI17_0_0RCTJSONClean(content.userInfo));

  return formattedNotification;
}

#endif //TARGET_OS_TV

ABI17_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_TV
- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:ABI17_0_0RCTLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:ABI17_0_0RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:ABI17_0_0RCTRemoteNotificationsRegistered
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationRegistrationError:)
                                               name:ABI17_0_0RCTErrorRemoteNotificationRegistrationFailed
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRegisterUserNotificationSettings:)
                                               name:ABI17_0_0RCTRegisterUserNotificationSettings
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"localNotificationReceived",
           @"remoteNotificationReceived",
           @"remoteNotificationsRegistered",
           @"remoteNotificationRegistrationError"];
}

+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([UIApplication instancesRespondToSelector:@selector(registerForRemoteNotifications)]) {
    [ABI17_0_0RCTSharedApplication() registerForRemoteNotifications];
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTRegisterUserNotificationSettings
                                                        object:self
                                                      userInfo:@{@"notificationSettings": notificationSettings}];
  }
}

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = deviceToken.bytes;
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:@{@"deviceToken" : [hexString copy]}];
}

+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTErrorRemoteNotificationRegistrationFailed
                                                      object:self
                                                    userInfo:@{@"error": error}];
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
{
  NSDictionary *userInfo = @{@"notification": notification};
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
              fetchCompletionHandler:(ABI17_0_0RCTRemoteNotificationCallback)completionHandler
{
  NSDictionary *userInfo = @{@"notification": notification, @"completionHandler": completionHandler};
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)didReceiveLocalNotification:(UILocalNotification *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI17_0_0RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:ABI17_0_0RCTFormatLocalNotification(notification)];
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification = [NSMutableDictionary dictionaryWithDictionary:notification.userInfo[@"notification"]];
  ABI17_0_0RCTRemoteNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
  NSString *notificationId = [[NSUUID UUID] UUIDString];
  remoteNotification[@"notificationId"] = notificationId;
  remoteNotification[@"remote"] = @YES;
  if (completionHandler) {
    if (!self.remoteNotificationCallbacks) {
      // Lazy initialization
      self.remoteNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }

  [self sendEventWithName:@"remoteNotificationReceived" body:remoteNotification];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [self sendEventWithName:@"remoteNotificationsRegistered" body:notification.userInfo];
}

- (void)handleRemoteNotificationRegistrationError:(NSNotification *)notification
{
  NSError *error = notification.userInfo[@"error"];
  NSDictionary *errorDetails = @{
    @"message": error.localizedDescription,
    @"code": @(error.code),
    @"details": error.userInfo,
  };
  [self sendEventWithName:@"remoteNotificationRegistrationError" body:errorDetails];
}

- (void)handleRegisterUserNotificationSettings:(NSNotification *)notification
{
  if (_requestPermissionsResolveBlock == nil) {
    return;
  }

  UIUserNotificationSettings *notificationSettings = notification.userInfo[@"notificationSettings"];
  NSDictionary *notificationTypes = @{
    @"alert": @((notificationSettings.types & UIUserNotificationTypeAlert) > 0),
    @"sound": @((notificationSettings.types & UIUserNotificationTypeSound) > 0),
    @"badge": @((notificationSettings.types & UIUserNotificationTypeBadge) > 0),
  };

  _requestPermissionsResolveBlock(notificationTypes);
  _requestPermissionsResolveBlock = nil;
}

ABI17_0_0RCT_EXPORT_METHOD(onFinishRemoteNotification:(NSString *)notificationId fetchResult:(UIBackgroundFetchResult)result) {
  ABI17_0_0RCTRemoteNotificationCallback completionHandler = self.remoteNotificationCallbacks[notificationId];
  if (!completionHandler) {
    ABI17_0_0RCTLogError(@"There is no completion handler with notification id: %@", notificationId);
    return;
  }
  completionHandler(result);
  [self.remoteNotificationCallbacks removeObjectForKey:notificationId];
}

/**
 * Update the application icon badge number on the home screen
 */
ABI17_0_0RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number)
{
  ABI17_0_0RCTSharedApplication().applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
ABI17_0_0RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  callback(@[@(ABI17_0_0RCTSharedApplication().applicationIconBadgeNumber)]);
}

ABI17_0_0RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions
                 resolver:(ABI17_0_0RCTPromiseResolveBlock)resolve
                 rejecter:(ABI17_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI17_0_0RCTRunningInAppExtension()) {
    reject(ABI17_0_0RCTErrorUnableToRequestPermissions, nil, ABI17_0_0RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }

  if (_requestPermissionsResolveBlock != nil) {
    ABI17_0_0RCTLogError(@"Cannot call requestPermissions twice before the first has returned.");
    return;
  }

  _requestPermissionsResolveBlock = resolve;

  UIUserNotificationType types = UIUserNotificationTypeNone;
  if (permissions) {
    if ([ABI17_0_0RCTConvert BOOL:permissions[@"alert"]]) {
      types |= UIUserNotificationTypeAlert;
    }
    if ([ABI17_0_0RCTConvert BOOL:permissions[@"badge"]]) {
      types |= UIUserNotificationTypeBadge;
    }
    if ([ABI17_0_0RCTConvert BOOL:permissions[@"sound"]]) {
      types |= UIUserNotificationTypeSound;
    }
  } else {
    types = UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound;
  }

  UIUserNotificationSettings *notificationSettings =
    [UIUserNotificationSettings settingsForTypes:types categories:nil];
  [ABI17_0_0RCTSharedApplication() registerUserNotificationSettings:notificationSettings];
}

ABI17_0_0RCT_EXPORT_METHOD(abandonPermissions)
{
  [ABI17_0_0RCTSharedApplication() unregisterForRemoteNotifications];
}

ABI17_0_0RCT_EXPORT_METHOD(checkPermissions:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  if (ABI17_0_0RCTRunningInAppExtension()) {
    callback(@[@{@"alert": @NO, @"badge": @NO, @"sound": @NO}]);
    return;
  }

  NSUInteger types = [ABI17_0_0RCTSharedApplication() currentUserNotificationSettings].types;
  callback(@[@{
    @"alert": @((types & UIUserNotificationTypeAlert) > 0),
    @"badge": @((types & UIUserNotificationTypeBadge) > 0),
    @"sound": @((types & UIUserNotificationTypeSound) > 0),
  }]);
}

ABI17_0_0RCT_EXPORT_METHOD(presentLocalNotification:(UILocalNotification *)notification)
{
  [ABI17_0_0RCTSharedApplication() presentLocalNotificationNow:notification];
}

ABI17_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(UILocalNotification *)notification)
{
  [ABI17_0_0RCTSharedApplication() scheduleLocalNotification:notification];
}

ABI17_0_0RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [ABI17_0_0RCTSharedApplication() cancelAllLocalNotifications];
}

ABI17_0_0RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
  for (UILocalNotification *notification in ABI17_0_0RCTSharedApplication().scheduledLocalNotifications) {
    __block BOOL matchesAll = YES;
    NSDictionary<NSString *, id> *notificationInfo = notification.userInfo;
    // Note: we do this with a loop instead of just `isEqualToDictionary:`
    // because we only require that all specified userInfo values match the
    // notificationInfo values - notificationInfo may contain additional values
    // which we don't care about.
    [userInfo enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      if (![notificationInfo[key] isEqual:obj]) {
        matchesAll = NO;
        *stop = YES;
      }
    }];
    if (matchesAll) {
      [ABI17_0_0RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

ABI17_0_0RCT_EXPORT_METHOD(getInitialNotification:(ABI17_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI17_0_0RCTPromiseRejectBlock)reject)
{
  NSMutableDictionary<NSString *, id> *initialNotification =
    [self.bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey] mutableCopy];

  UILocalNotification *initialLocalNotification =
    self.bridge.launchOptions[UIApplicationLaunchOptionsLocalNotificationKey];

  if (initialNotification) {
    initialNotification[@"remote"] = @YES;
    resolve(initialNotification);
  } else if (initialLocalNotification) {
    resolve(ABI17_0_0RCTFormatLocalNotification(initialLocalNotification));
  } else {
    resolve((id)kCFNull);
  }
}

ABI17_0_0RCT_EXPORT_METHOD(getScheduledLocalNotifications:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  NSArray<UILocalNotification *> *scheduledLocalNotifications = ABI17_0_0RCTSharedApplication().scheduledLocalNotifications;
  NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
  for (UILocalNotification *notification in scheduledLocalNotifications) {
    [formattedScheduledLocalNotifications addObject:ABI17_0_0RCTFormatLocalNotification(notification)];
  }
  callback(@[formattedScheduledLocalNotifications]);
}

ABI17_0_0RCT_EXPORT_METHOD(removeAllDeliveredNotifications)
{
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center removeAllDeliveredNotifications];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(removeDeliveredNotifications:(NSArray<NSString *> *)identifiers)
{
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center removeDeliveredNotificationsWithIdentifiers:identifiers];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(getDeliveredNotifications:(ABI17_0_0RCTResponseSenderBlock)callback)
{
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *_Nonnull notifications) {
      NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];

      for (UNNotification *notification in notifications) {
        [formattedNotifications addObject:ABI17_0_0RCTFormatUNNotification(notification)];
      }
      callback(@[formattedNotifications]);
    }];
  }
}

#else //TARGET_OS_TV

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

#endif //TARGET_OS_TV

@end
