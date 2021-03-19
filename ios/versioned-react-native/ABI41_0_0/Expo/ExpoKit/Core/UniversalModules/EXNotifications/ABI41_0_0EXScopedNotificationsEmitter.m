// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXNotifications/ABI41_0_0EXNotificationsEmitter.h>)

#import "ABI41_0_0EXScopedNotificationsEmitter.h"
#import "ABI41_0_0EXScopedNotificationsUtils.h"
#import "ABI41_0_0EXScopedNotificationSerializer.h"

@interface ABI41_0_0EXScopedNotificationsEmitter ()

@property (nonatomic, strong) NSString *experienceId;

@end

@interface ABI41_0_0EXNotificationsEmitter (Protected)

- (NSDictionary *)serializedNotification:(UNNotification *)notification;
- (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse;

@end

@implementation ABI41_0_0EXScopedNotificationsEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  if ([ABI41_0_0EXScopedNotificationsUtils shouldNotification:response.notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
  } else {
    completionHandler();
  }
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([ABI41_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
  } else {
    completionHandler(UNNotificationPresentationOptionNone);
  }
}

- (NSDictionary *)serializedNotification:(UNNotification *)notification
{
  return [ABI41_0_0EXScopedNotificationSerializer serializedNotification:notification];
}

- (NSDictionary *)serializedNotificationResponse:(UNNotificationResponse *)notificationResponse
{
  return [ABI41_0_0EXScopedNotificationSerializer serializedNotificationResponse:notificationResponse];
}

@end

#endif
