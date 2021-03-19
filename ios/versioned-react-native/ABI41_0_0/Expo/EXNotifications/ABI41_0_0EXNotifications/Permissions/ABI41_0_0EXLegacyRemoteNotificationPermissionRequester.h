// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <ABI41_0_0EXNotifications/ABI41_0_0EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface ABI41_0_0EXLegacyRemoteNotificationPermissionRequester : NSObject <ABI41_0_0UMPermissionsRequester, ABI41_0_0EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI41_0_0UMPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI41_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
