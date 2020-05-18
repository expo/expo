// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationsEmitter.h>)

#import "EXScopedNotificationsEmitter.h"

@interface EXScopedNotificationsEmitter ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation EXScopedNotificationsEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (BOOL)_shouldHandleNotification:(UNNotification *)notification
{
  NSString *notificationExperienceId = notification.request.content.userInfo[@"experienceId"];
  if (!notificationExperienceId) {
    return true;
  }
  return [notificationExperienceId isEqual:_experienceId];
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  if ([self _shouldHandleNotification:response.notification]) {
    [super userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([self _shouldHandleNotification:notification]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler(UNNotificationPresentationOptionNone);
}

@end

#endif
