/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTPushNotificationManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTEventDispatcher.h"
#import "ABI6_0_0RCTUtils.h"

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

#define UIUserNotificationTypeAlert UIRemoteNotificationTypeAlert
#define UIUserNotificationTypeBadge UIRemoteNotificationTypeBadge
#define UIUserNotificationTypeSound UIRemoteNotificationTypeSound
#define UIUserNotificationTypeNone  UIRemoteNotificationTypeNone
#define UIUserNotificationType      UIRemoteNotificationType

#endif

NSString *const ABI6_0_0RCTLocalNotificationReceived = @"LocalNotificationReceived";
NSString *const ABI6_0_0RCTRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const ABI6_0_0RCTRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";

@implementation ABI6_0_0RCTConvert (UILocalNotification)

+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  UILocalNotification *notification = [UILocalNotification new];
  notification.fireDate = [ABI6_0_0RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.alertBody = [ABI6_0_0RCTConvert NSString:details[@"alertBody"]];
  notification.alertAction = [ABI6_0_0RCTConvert NSString:details[@"alertAction"]];
  notification.soundName = [ABI6_0_0RCTConvert NSString:details[@"soundName"]] ?: UILocalNotificationDefaultSoundName;
  notification.userInfo = [ABI6_0_0RCTConvert NSDictionary:details[@"userInfo"]];
  notification.category = [ABI6_0_0RCTConvert NSString:details[@"category"]];
  if (details[@"applicationIconBadgeNumber"]) {
    notification.applicationIconBadgeNumber = [ABI6_0_0RCTConvert NSInteger:details[@"applicationIconBadgeNumber"]];
  }
  return notification;
}

@end

@implementation ABI6_0_0RCTPushNotificationManager

ABI6_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
}

- (void)setBridge:(ABI6_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  // TODO: if we add an explicit "startObserving" method, we can take this out
  // of the application startup path

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:ABI6_0_0RCTLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:ABI6_0_0RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:ABI6_0_0RCTRemoteNotificationsRegistered
                                             object:nil];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSDictionary<NSString *, id> *initialNotification =
    [_bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey] copy];
  return @{@"initialNotification": ABI6_0_0RCTNullIfNil(initialNotification)};
}

+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([UIApplication instancesRespondToSelector:@selector(registerForRemoteNotifications)]) {
    [[UIApplication sharedApplication] registerForRemoteNotifications];
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
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:@{@"deviceToken" : [hexString copy]}];
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];
}

+ (void)didReceiveLocalNotification:(UILocalNotification *)notification
{
  NSMutableDictionary *details = [NSMutableDictionary new];
  if (notification.alertBody) {
    details[@"alertBody"] = notification.alertBody;
  }
  if (notification.userInfo) {
    details[@"userInfo"] = ABI6_0_0RCTJSONClean(notification.userInfo);
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:details];
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"localNotificationReceived"
                                              body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationReceived"
                                              body:notification.userInfo];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationsRegistered"
                                              body:notification.userInfo];
}

/**
 * Update the application icon badge number on the home screen
 */
ABI6_0_0RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number)
{
  ABI6_0_0RCTSharedApplication().applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
ABI6_0_0RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(ABI6_0_0RCTResponseSenderBlock)callback)
{
  callback(@[@(ABI6_0_0RCTSharedApplication().applicationIconBadgeNumber)]);
}

ABI6_0_0RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions)
{
  if (ABI6_0_0RCTRunningInAppExtension()) {
    return;
  }

  UIUserNotificationType types = UIUserNotificationTypeNone;
  if (permissions) {
    if ([ABI6_0_0RCTConvert BOOL:permissions[@"alert"]]) {
      types |= UIUserNotificationTypeAlert;
    }
    if ([ABI6_0_0RCTConvert BOOL:permissions[@"badge"]]) {
      types |= UIUserNotificationTypeBadge;
    }
    if ([ABI6_0_0RCTConvert BOOL:permissions[@"sound"]]) {
      types |= UIUserNotificationTypeSound;
    }
  } else {
    types = UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound;
  }

  UIApplication *app = ABI6_0_0RCTSharedApplication();
  if ([app respondsToSelector:@selector(registerUserNotificationSettings:)]) {
    UIUserNotificationSettings *notificationSettings =
      [UIUserNotificationSettings settingsForTypes:(NSUInteger)types categories:nil];
    [app registerUserNotificationSettings:notificationSettings];
  } else {
    [app registerForRemoteNotificationTypes:(NSUInteger)types];
  }
}

ABI6_0_0RCT_EXPORT_METHOD(abandonPermissions)
{
  [ABI6_0_0RCTSharedApplication() unregisterForRemoteNotifications];
}

ABI6_0_0RCT_EXPORT_METHOD(checkPermissions:(ABI6_0_0RCTResponseSenderBlock)callback)
{
  if (ABI6_0_0RCTRunningInAppExtension()) {
    callback(@[@{@"alert": @NO, @"badge": @NO, @"sound": @NO}]);
    return;
  }

  NSUInteger types = 0;
  if ([UIApplication instancesRespondToSelector:@selector(currentUserNotificationSettings)]) {
    types = [ABI6_0_0RCTSharedApplication() currentUserNotificationSettings].types;
  } else {

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

    types = [ABI6_0_0RCTSharedApplication() enabledRemoteNotificationTypes];

#endif

  }

  callback(@[@{
    @"alert": @((types & UIUserNotificationTypeAlert) > 0),
    @"badge": @((types & UIUserNotificationTypeBadge) > 0),
    @"sound": @((types & UIUserNotificationTypeSound) > 0),
  }]);
}

ABI6_0_0RCT_EXPORT_METHOD(presentLocalNotification:(UILocalNotification *)notification)
{
  [ABI6_0_0RCTSharedApplication() presentLocalNotificationNow:notification];
}

ABI6_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(UILocalNotification *)notification)
{
  [ABI6_0_0RCTSharedApplication() scheduleLocalNotification:notification];
}

ABI6_0_0RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [ABI6_0_0RCTSharedApplication() cancelAllLocalNotifications];
}

ABI6_0_0RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary *)userInfo)
{
  for (UILocalNotification *notification in [UIApplication sharedApplication].scheduledLocalNotifications) {
    __block BOOL matchesAll = YES;
    NSDictionary *notificationInfo = notification.userInfo;
    [userInfo enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      if (![notificationInfo[key] isEqual:obj]) {
        matchesAll = NO;
        *stop = YES;
      }
    }];
    if (matchesAll) {
      [[UIApplication sharedApplication] cancelLocalNotification:notification];
    }
  }
}

@end
