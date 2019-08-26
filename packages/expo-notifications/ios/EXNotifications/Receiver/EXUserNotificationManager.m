// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUserNotificationManager.h"
#import <EXNotifications/EXPostOffice.h>
#import <EXNotifications/EXNotificationConverter.h>

@implementation EXUserNotificationManager

+ (EXUserNotificationManager*)sharedInstance
{
  static EXUserNotificationManager *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[EXUserNotificationManager alloc] init];
  });
  return sharedInstance;
}

# pragma mark - UNUserNotificationCenterDelegate

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  NSMutableDictionary *userInteractionBundle = [EXNotificationConverter convertToDictionary:response.notification.request.content];
  
  userInteractionBundle[@"remote"] = @([response.notification.request.trigger isKindOfClass: [UNPushNotificationTrigger class]]);
  userInteractionBundle[@"actionId"] = response.actionIdentifier != UNNotificationDefaultActionIdentifier? response.actionIdentifier : nil;
  userInteractionBundle[@"userTest"] = [response isKindOfClass:[UNTextInputNotificationResponse class]]?
  ((UNTextInputNotificationResponse *) response).userText : nil;
  
  NSString *appId = response.notification.request.content.userInfo[@"appId"];
  [[EXThreadSafePostOffice sharedInstance] notifyAboutUserInteractionForAppId:appId userInteraction:userInteractionBundle];
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  __block NSDictionary *userInfo = notification.request.content.userInfo;
  __block NSString *appId = userInfo[@"appId"];
  __block NSMutableDictionary *notificationBundle = [EXNotificationConverter convertToDictionary:notification.request.content];
  
  __block BOOL shouldDisplayInForeground = NO || userInfo[@"canInForeground"];
  
  [[EXThreadSafePostOffice sharedInstance] doWeHaveMailboxRegisteredAsAppId:appId completionHandler:^void (BOOL isJSActive) {
    if (isJSActive || shouldDisplayInForeground) {
      NSUInteger notificationPresentationOptions = UNNotificationPresentationOptionAlert;
      
      if (notificationBundle[@"count"]) {
        notificationPresentationOptions += UNNotificationPresentationOptionBadge;
      }
      
      if (notificationBundle[@"sound"]) {
        notificationPresentationOptions += UNNotificationPresentationOptionSound;
      }
      
      completionHandler(notificationPresentationOptions);
      return;
    }
    
    [[EXThreadSafePostOffice sharedInstance] notifyAboutForegroundNotificationForAppId:appId notification:notificationBundle];
    
    completionHandler(UNNotificationPresentationOptionNone);
  }];
}

@end
