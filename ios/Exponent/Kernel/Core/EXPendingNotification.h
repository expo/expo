//  Copyright © 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UserNotifications.h>

@protocol EXLegacyUserNotificationManager <NSObject>

- (NSString *)internalIdForIdentifier:(NSString *)identifier experienceId:(NSString *)experienceId;
- (NSString *)exportedIdForInternalIdentifier:(NSString *)identifier;

@end

@interface EXPendingNotification : NSObject

@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithNotification:(UNNotification *)notification;
- (instancetype)initWithNotificationResponse:(UNNotificationResponse *)notificationResponse identifiersManager:(id<EXLegacyUserNotificationManager>)manager;

- (NSDictionary *)properties;

@end
