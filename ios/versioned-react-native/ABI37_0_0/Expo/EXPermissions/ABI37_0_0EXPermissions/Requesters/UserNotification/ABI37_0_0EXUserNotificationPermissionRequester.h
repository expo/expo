// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMPermissionsInterface.h>
#import <UserNotifications/UserNotifications.h>
#import <ABI37_0_0UMPermissionsInterface/ABI37_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI37_0_0EXUserNotificationPermissionRequester : NSObject<ABI37_0_0UMPermissionsRequester>

- (instancetype)initWithNotificationProxy:(id<ABI37_0_0UMUserNotificationCenterProxyInterface>)proxy withMethodQueue:(dispatch_queue_t)queue;

@end
