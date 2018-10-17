// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXUserNotificationManager.h"
#import "EXKernel.h"
#import "EXRemoteNotificationManager.h"
#import "EXEnvironment.h"
#import "EXNotificationScoper.h"

@interface EXUserNotificationManager()
@end

@implementation EXUserNotificationManager

+ (instancetype)sharedInstance
{
  static EXUserNotificationManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [EXUserNotificationManager new];
    }
  });
  return theManager;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
didReceiveNotificationResponse:(UNNotificationResponse *)response
         withCompletionHandler:(void (^)(void))completionHandler
{
  BOOL isFromBackground = [UIApplication sharedApplication].applicationState != UIApplicationStateActive;
  NSDictionary *payload = response.notification.request.content.userInfo;
  if (payload) {
    NSDictionary *body = payload[@"body"];
    NSString *experienceId = payload[@"experienceId"];
    NSString *userText = nil;
    NSString *actionId = @"DEFAULT_ACTION";
    
    if ([response.actionIdentifier isEqualToString:UNNotificationDismissActionIdentifier]) {
      actionId = @"DISMISS_ACTION";
    } else if (![response.actionIdentifier isEqualToString:UNNotificationDefaultActionIdentifier]) {
      actionId = response.actionIdentifier;
      if (![EXEnvironment sharedEnvironment].isDetached) {
        actionId = [EXNotificationScoper split:actionId][1];
      }
    }
    
    if ([response isKindOfClass:[UNTextInputNotificationResponse class]]) {
      userText = ((UNTextInputNotificationResponse *) response).userText;
    }
    
    BOOL isRemote = [response.notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]];
    if (body && experienceId) {
      [[EXKernel sharedInstance] sendNotification:body
                               toExperienceWithId:experienceId
                                   fromBackground:isFromBackground
                                         isRemote:isRemote
                                         actionId:actionId
                                         userText:userText];
    }
  }
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center
       willPresentNotification:(UNNotification *)notification
         withCompletionHandler:(void (^)(UNNotificationPresentationOptions options))completionHandler
{
  NSDictionary *payload = notification.request.content.userInfo;
  if (payload) {
    NSDictionary *body = payload[@"body"];
    NSString *experienceId = payload[@"experienceId"];
    NSString *userText = nil;
    
    BOOL isRemote = [notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]];
    if (body && experienceId) {
      [[EXKernel sharedInstance] sendNotification:body
                               toExperienceWithId:experienceId
                                   fromBackground:NO
                                         isRemote:isRemote
                                         actionId:@"WILL_PRESENT_ACTION"
                                         userText:userText];
    }
  }
  completionHandler(UNNotificationPresentationOptionAlert + UNNotificationPresentationOptionSound);
}

@end
