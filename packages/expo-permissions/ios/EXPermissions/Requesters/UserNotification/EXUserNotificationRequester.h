// Copyright © 2018 650 Industries. All rights reserved.

#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <UserNotifications/UserNotifications.h>
#import <UMPermissionsInterface/UMUserNotificationCenterProxyInterface.h>

@interface EXUserNotificationRequester : NSObject<UMPermissionsRequester>

- (instancetype)initWithNotificationProxy:(id<UMUserNotificationCenterProxyInterface>)proxy withMetodQueqe:(dispatch_queue_t)queue;

@end
