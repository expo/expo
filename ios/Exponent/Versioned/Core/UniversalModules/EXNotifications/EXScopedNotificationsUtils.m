// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXScopedNotificationsUtils.h"

@implementation EXScopedNotificationsUtils

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)experienceId
{
  NSString *notificationExperienceId = request.content.userInfo[@"experienceId"];
  if (!notificationExperienceId) {
    return true;
  }
  return [notificationExperienceId isEqual:experienceId];
}

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)experienceId
{
  return [EXScopedNotificationsUtils shouldNotificationRequest:notification.request beHandledByExperience:experienceId];
}

@end
