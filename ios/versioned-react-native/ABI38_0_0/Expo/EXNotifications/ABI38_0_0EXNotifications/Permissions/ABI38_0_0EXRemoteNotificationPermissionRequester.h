// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsInterface.h>
#import <ABI38_0_0EXNotifications/ABI38_0_0EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface ABI38_0_0EXRemoteNotificationPermissionRequester : NSObject <ABI38_0_0UMPermissionsRequester, ABI38_0_0EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI38_0_0UMPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI38_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
