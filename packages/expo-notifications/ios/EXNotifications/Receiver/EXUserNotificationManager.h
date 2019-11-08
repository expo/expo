// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXNotifications/EXNotifications.h>
#import <EXNotifications/EXUserNotificationCenter.h>
#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

@interface EXUserNotificationManager : NSObject <UNUserNotificationCenterDelegate>

+ (EXUserNotificationManager*)sharedInstance;

@end
