// Copyright © 2018 650 Industries. All rights reserved.

#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMPermissionsInterface.h>
#import <UserNotifications/UserNotifications.h>
#import <ABI36_0_0UMPermissionsInterface/ABI36_0_0UMUserNotificationCenterProxyInterface.h>

@interface ABI36_0_0EXUserNotificationPermissionRequester : NSObject<ABI36_0_0UMPermissionsRequester>

- (instancetype)initWithNotificationProxy:(id<ABI36_0_0UMUserNotificationCenterProxyInterface>)proxy withMethodQueue:(dispatch_queue_t)queue;

@end
