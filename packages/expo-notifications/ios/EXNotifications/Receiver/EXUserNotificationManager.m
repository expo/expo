// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotificationConverter.h>
#import <EXNotifications/EXPostOffice.h>
#import <EXNotifications/EXUserNotificationManager.h>

@implementation EXUserNotificationManager

+ (EXUserNotificationManager *)sharedInstance {
  static EXUserNotificationManager *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXUserNotificationManager alloc] init];
  });
  return sharedInstance;
}

#pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
    didReceiveNotificationResponse:(UNNotificationResponse *)response
             withCompletionHandler:(void (^)(void))completionHandler {
  NSMutableDictionary *userInteractionBundle =
      [EXNotificationConverter convertToDictionary:response.notification.request.content];

  userInteractionBundle[@"remote"] =
      @([response.notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]]);
  
  userInteractionBundle[@"actionId"] =
      ![response.actionIdentifier isEqualToString:UNNotificationDefaultActionIdentifier]? response.actionIdentifier
                                                                         : nil;
  userInteractionBundle[@"userText"] =
      [response isKindOfClass:[UNTextInputNotificationResponse class]]
          ? ((UNTextInputNotificationResponse *)response).userText
          : nil;

  NSString *appId = userInteractionBundle[@"appId"];
  [[EXThreadSafePostOffice sharedInstance]
      notifyAboutUserInteractionForAppId:appId
                         userInteraction:userInteractionBundle];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:
             (void (^)(UNNotificationPresentationOptions options))completionHandler {
  __block NSDictionary *userInfo = notification.request.content.userInfo;
  __block NSMutableDictionary *notificationBundle =
      [EXNotificationConverter convertToDictionary:notification.request.content];
  __block NSString *appId = notificationBundle[@"appId"];

  if (userInfo[@"presentedByUser"]) {
    [EXUserNotificationManager presentForegroundNotification:notificationBundle
                                           completionHandler:completionHandler];
    return;
  }

  [[EXThreadSafePostOffice sharedInstance]
      tryToSendForegroundNotificationTo:appId
                 foregroundNotification:notificationBundle
                      completionHandler:^void(BOOL successful) {
                        if (!successful) {
                          [EXUserNotificationManager
                              presentForegroundNotification:notificationBundle
                                          completionHandler:completionHandler];
                        }
                      }];
}

+ (void)presentForegroundNotification:(NSDictionary *)notificationBundle
                    completionHandler:
                        (void (^)(UNNotificationPresentationOptions options))completionHandler {
  NSUInteger notificationPresentationOptions = UNNotificationPresentationOptionAlert;

  if (notificationBundle[@"count"]) {
    notificationPresentationOptions += UNNotificationPresentationOptionBadge;
  }

  if (notificationBundle[@"sound"]) {
    notificationPresentationOptions += UNNotificationPresentationOptionSound;
  }

  completionHandler(notificationPresentationOptions);
}

@end
