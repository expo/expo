// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationsUtils.h"

@implementation ABI40_0_0EXScopedNotificationsUtils

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
  return [ABI40_0_0EXScopedNotificationsUtils shouldNotificationRequest:notification.request beHandledByExperience:experienceId];
}

@end
