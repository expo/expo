//  Copyright © 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

@interface EXPendingNotification : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithNotification:(UNNotification *)notification;
- (instancetype)initWithNotificationResponse:(UNNotificationResponse *)notificationResponse;

- (NSDictionary *)properties;

@end
