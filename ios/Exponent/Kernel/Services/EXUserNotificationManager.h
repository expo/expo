// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#import "EXUserNotificationCenter.h"
#import "EXPendingNotification.h"

@interface EXUserNotificationManager : NSObject <UNUserNotificationCenterDelegate>

- (EXPendingNotification *)initialNotificationForExperience:(NSString *)experienceId;

@end
