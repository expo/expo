// Copyright 2018-present 650 Industries. All rights reserved.

#import "ABI40_0_0EXScopedNotificationsUtils.h"

@implementation ABI40_0_0EXScopedNotificationsUtils

+ (BOOL)shouldNotificationRequest:(UNNotificationRequest *)request beHandledByExperience:(NSString *)scopeKey
{
  NSString *notificationScopeKey = request.content.userInfo[@"experienceId"];
  if (!notificationScopeKey) {
    return true;
  }
  return [notificationScopeKey isEqual:scopeKey];
}

+ (BOOL)shouldNotification:(UNNotification *)notification beHandledByExperience:(NSString *)scopeKey
{
  return [ABI40_0_0EXScopedNotificationsUtils shouldNotificationRequest:notification.request beHandledByExperience:scopeKey];
}

@end
