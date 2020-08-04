// Copyright 2018-present 650 Industries. All rights reserved.

#if __has_include(<EXNotifications/EXNotificationsEmitter.h>)

#import "EXScopedNotificationsEmitter.h"
#import "EXScopedNotificationsUtils.h"
#import "EXScopedNotificationSerializer.h"

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
    [self.eventEmitter sendEventWithName:onDidReceiveNotificationResponse body:[EXScopedNotificationSerializer serializedNotificationResponse:response]];
  }
  
  completionHandler();
}

- (void)userNotificationCenter:(UNUserNotificationCenter *)center willPresentNotification:(UNNotification *)notification withCompletionHandler:(void (^)(UNNotificationPresentationOptions))completionHandler
{
  if ([EXScopedNotificationsUtils shouldNotification:notification beHandledByExperience:_experienceId]) {
    [self.eventEmitter sendEventWithName:onDidReceiveNotification body:[EXScopedNotificationSerializer serializedNotification:notification]];
  }
  
  completionHandler(UNNotificationPresentationOptionNone);
}

@end

#endif
