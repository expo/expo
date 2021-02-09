// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#import "EXUserNotificationCenter.h"
#import "EXPendingNotification.h"
#import "EXNotifications.h"

#import <EXNotifications/EXNotificationsDelegate.h>

@interface EXUserNotificationManager : NSObject <UNUserNotificationCenterDelegate, EXNotificationsIdentifiersManager, EXNotificationsDelegate>

- (EXPendingNotification *)initialNotificationForExperience:(NSString *)experienceId;

@end
