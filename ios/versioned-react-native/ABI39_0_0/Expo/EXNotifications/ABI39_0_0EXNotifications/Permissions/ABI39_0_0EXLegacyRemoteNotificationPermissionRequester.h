// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXRemoteNotificationPermissionSingletonModule.h>

// TODO: Remove once we deprecate and remove "notifications" permission type
@interface ABI39_0_0EXLegacyRemoteNotificationPermissionRequester : NSObject <ABI39_0_0UMPermissionsRequester, ABI39_0_0EXRemoteNotificationPermissionDelegate>

- (instancetype)initWithUserNotificationPermissionRequester:(id<ABI39_0_0UMPermissionsRequester>)userNotificationPermissionRequester
                                        permissionPublisher:(id<ABI39_0_0EXRemoteNotificationPermissionProgressPublisher>)permissionProgressPublisher
                                            withMethodQueue:(dispatch_queue_t)methodQueue;

@end
