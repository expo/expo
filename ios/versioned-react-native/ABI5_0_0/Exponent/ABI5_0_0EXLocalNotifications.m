// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI5_0_0EXLocalNotifications.h"

@import UIKit;

@implementation ABI5_0_0EXLocalNotifications

ABI5_0_0RCT_EXPORT_MODULE(ABI5_0_0EXLocalNotifications_EXPERIMENTAL)

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

ABI5_0_0RCT_EXPORT_METHOD(registerForUserNotifications)
{
  UIUserNotificationType notificationTypes = UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert;
  UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:notificationTypes categories:nil];
  [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
}

ABI5_0_0RCT_EXPORT_METHOD(scheduleLocalNotification:(NSString *)message forDate:(NSDate *)date)
{
  UILocalNotification *notification = [[UILocalNotification alloc] init];
  notification.alertBody = message;
  notification.fireDate = date;
  [[UIApplication sharedApplication] scheduleLocalNotification:notification];
}

ABI5_0_0RCT_EXPORT_METHOD(presentLocalNotificationNow:(NSString *)message)
{
  UILocalNotification *notification = [[UILocalNotification alloc] init];
  notification.alertBody = message;
  [[UIApplication sharedApplication] presentLocalNotificationNow:notification];
}

@end
