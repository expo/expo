//  Copyright © 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>
#import "EXNotifications.h"

@interface EXPendingNotification : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithNotification:(UNNotification *)notification;
- (instancetype)initWithNotificationResponse:(UNNotificationResponse *)notificationResponse identifiersManager:(id<EXNotificationsIdentifiersManager>)manager;

- (NSDictionary *)properties;

@end
