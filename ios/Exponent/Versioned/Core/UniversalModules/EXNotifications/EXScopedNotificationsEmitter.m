// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationsEmitter.h>)

#import "EXScopedNotificationsEmitter.h"
#import "EXScopedNotificationsUtils.h"

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

- (void)userNotificationCenter:(UNUserNotificationCenter *)center didReceiveNotificationResponse:(UNNotificationResponse *)response withCompletionHandler:(void (^)(void))completionHandler
{
  if ([EXScopedNotificationsUtils shouldNotification:response.notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center didReceiveNotificationResponse:response withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [super userNotificationCenter:center willPresentNotification:notification withCompletionHandler:completionHandler];
    return;
  }
  
  completionHandler(UNNotificationPresentationOptionNone);
}

@end

#endif
