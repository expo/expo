// Copyright 2015-present 650 Industries. All rights reserved.

#import <UserNotifications/UserNotifications.h>
#import <UMCore/UMSingletonModule.h>
#import <EXNotifications/UMNotificationsConsumer.h>
#import <EXNotifications/UMNotificationsManager.h>

@interface EXUserNotificationsManager : UMSingletonModule <UNUserNotificationCenterDelegate, UMNotificationsManager>

@end
