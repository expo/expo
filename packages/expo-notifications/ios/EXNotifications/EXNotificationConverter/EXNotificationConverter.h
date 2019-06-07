// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UserNotifications/UNNotificationContent.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotificationConverter : NSObject

+ (NSMutableDictionary*)convertToDictionary:(UNNotificationContent*)notificationContent;

+ (UNMutableNotificationContent*)convertToNotificationContent:(NSDictionary *)payload;

@end

NS_ASSUME_NONNULL_END
