// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXNotifications/ABI38_0_0EXNotificationsEmitter.h>)

#import "ABI38_0_0EXScopedNotificationsEmitter.h"
#import "ABI38_0_0EXScopedNotificationsUtils.h"

@interface ABI38_0_0EXScopedNotificationsEmitter ()

@property (nonatomic, strong) NSString *experienceId;

@end

@implementation ABI38_0_0EXScopedNotificationsEmitter

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  
  return self;
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:response.notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([ABI38_0_0EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler(UNNotificationPresentationOptionNone);
}

@end

#endif
